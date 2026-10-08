import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { LanguageConfigProvider } from "@/lib/language-config";
import { SiteConfigProvider } from "@/lib/site-config";
import { FormConfigProvider } from "@/lib/form-config";
import { JobsProvider } from "@/lib/jobs-store";
import { TaxonomyProvider } from "@/lib/taxonomy-store";
import { NewsProvider } from "@/lib/news-store";
import { InboxProvider } from "@/lib/inbox-store";
import { AuthProvider } from "@/lib/auth-store";
import { Toaster } from "@/components/ui/sonner";
import { fetchSiteConfig } from "@/services/site-config.api";
import { getSiteBrand, setCachedSiteConfig } from "@/lib/route-meta";
import { getFaviconLink, getInitialSiteConfig } from "@/lib/site-config-cache";
import { translate } from "@/lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      const config = await fetchSiteConfig();
      setCachedSiteConfig(config);
      return { siteConfig: config };
    } catch {
      const fallback = getInitialSiteConfig();
      if (fallback) setCachedSiteConfig(fallback);
      return { siteConfig: fallback };
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${translate("page.home.title")} — ${getSiteBrand()}` },
      {
        name: "description",
        content: translate("page.home.description"),
      },
      { property: "og:title", content: `${translate("page.home.title")} — ${getSiteBrand()}` },
      {
        property: "og:description",
        content: translate("page.home.description"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      getFaviconLink(),
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageConfigProvider>
        <I18nProvider>
          <SiteConfigProvider>
            <FormConfigProvider>
              <TaxonomyProvider>
                <JobsProvider>
                  <NewsProvider>
                    <InboxProvider>
                      <AuthProvider>
                      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                      <Outlet />
                      <Toaster />
                      </AuthProvider>
                    </InboxProvider>
                  </NewsProvider>
                </JobsProvider>
              </TaxonomyProvider>
            </FormConfigProvider>
          </SiteConfigProvider>
        </I18nProvider>
      </LanguageConfigProvider>
    </QueryClientProvider>
  );
}
