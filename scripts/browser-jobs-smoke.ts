import { chromium } from "../node_modules/.bun/playwright@1.63.0/node_modules/playwright";

const baseUrl = process.env.BASE_URL ?? "http://localhost:5173";
const browserExecutable = process.env.BROWSER_EXECUTABLE;
const profileDir = process.env.BROWSER_PROFILE ?? `${process.env.TEMP ?? ".tmp"}/career-portal-browser`;

const context = await chromium.launchPersistentContext(profileDir, {
  ...(browserExecutable ? { executablePath: browserExecutable } : {}),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  timeout: 15_000,
});

try {
  const page = context.pages()[0] ?? (await context.newPage());
  const errors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} (${request.failure()?.errorText ?? "unknown"})`);
  });

  const startedAt = performance.now();
  await page.goto(`${baseUrl}/jobs`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const jobsLoadedAt = performance.now();
  const firstJob = page.locator('a[href^="/jobs/"]').first();
  await firstJob.waitFor({ state: "visible", timeout: 30_000 });
  const cardVisibleAt = performance.now();
  const href = await firstJob.getAttribute("href");
  if (!href) throw new Error("First job card has no detail URL");

  await firstJob.click();
  await page.waitForURL(`**${href}`, { timeout: 30_000 });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 30_000 });
  const detailLoadedAt = performance.now();

  const result = {
    listUrl: `${baseUrl}/jobs`,
    detailUrl: page.url(),
    heading: await page.locator("h1").first().textContent(),
    timingsMs: {
      listDomContentLoaded: Math.round(jobsLoadedAt - startedAt),
      firstCardVisible: Math.round(cardVisibleAt - startedAt),
      detailAfterClick: Math.round(detailLoadedAt - cardVisibleAt),
    },
    consoleErrors: errors,
    failedRequests,
  };
  console.log(JSON.stringify(result, null, 2));
  if (errors.length || failedRequests.length) process.exitCode = 1;
} finally {
  await context.close();
}
