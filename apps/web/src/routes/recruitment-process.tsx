import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { useSiteConfig } from "@/lib/site-config";
import { createRouteMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/recruitment-process")({
  head: createRouteMeta({ titleKey: "page.recruitmentProcess.title", descriptionKey: "page.recruitmentProcess.description" }),
  component: RecruitmentProcessPage,
});

function RecruitmentProcessPage() {
  const { tr } = useI18n();
  const { config } = useSiteConfig();
  const navigate = useNavigate();
  const enabled = config.modules.recruitmentProcess;
  useEffect(() => {
    if (!enabled) void navigate({ to: "/" });
  }, [enabled, navigate]);
  if (!enabled) return null;
  const process = config.recruitmentProcess;
  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{tr(process.title)}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{tr(process.subtitle)}</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {process.steps.map((step, index) => (
            <li key={step.id} className="rounded-xl border border-border bg-card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>
              <h2 className="mt-5 font-display text-lg font-semibold">{tr(step.title)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr(step.body)}</p>
            </li>
          ))}
        </ol>
      </section>
    </SiteLayout>
  );
}
