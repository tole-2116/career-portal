import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, CalendarCheck, UserPlus, UserCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { candidates, stageLabels, stageOrder, weeklyApplications } from "@/data/candidates";
import { fetchAdminActivity, type AdminActivity } from "@/lib/api/admin-activity";
import { fetchJobs } from "@/lib/api/jobs";
import { adminCandidateApi } from "@/services/admin-candidate.api";
import { useI18n } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/admin-route-guard";
import { createRouteMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ location }) => requireAdminSession(location.pathname),
  head: createRouteMeta({
    titleKey: "admin.dashboard.meta.title",
    descriptionKey: "admin.dashboard.meta.description",
    noIndex: true,
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { t, tr, language } = useI18n();
  const [activityItems, setActivityItems] = useState<AdminActivity[]>([]);
  const [kpiValues, setKpiValues] = useState({
    openJobs: null as number | null,
    newCandidates: null as number | null,
    interviews: null as number | null,
    hires: null as number | null,
  });
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchAdminActivity().then((items) => {
      if (active) setActivityItems(items);
    }).catch(() => {
      if (active) setActivityItems([]);
    });
    const loadKpis = () => {
      setKpiLoading(true);
      void fetchJobs({ status: "open", limit: 1 })
        .then((result) => {
          if (active) setKpiValues((current) => ({ ...current, openJobs: result.total }));
        })
        .catch(() => {
          if (active) setKpiValues((current) => ({ ...current, openJobs: null }));
        });

      void Promise.all([
        adminCandidateApi.getCandidates({ status: "new", page: 1, pageSize: 1 }),
        adminCandidateApi.getCandidates({ status: "interview", page: 1, pageSize: 1 }),
        adminCandidateApi.getCandidates({ status: "hired", page: 1, pageSize: 1 }),
      ]).then(([newResult, interviewResult, hiresResult]) => {
        if (!active) return;
        setKpiValues((current) => ({
          ...current,
          newCandidates: newResult.total,
          interviews: interviewResult.total,
          hires: hiresResult.total,
        }));
      }).catch(() => {
        if (active) {
          setKpiValues((current) => ({
            ...current,
            newCandidates: null,
            interviews: null,
            hires: null,
          }));
        }
      }).finally(() => {
        if (active) setKpiLoading(false);
      });
    };

    loadKpis();
    const onFocus = () => loadKpis();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const { openJobs, newCandidates, interviews, hires } = kpiValues;

  const kpis = [
    { label: t("admin.kpi.openJobs"), value: openJobs, icon: Briefcase },
    { label: t("admin.kpi.newCandidates"), value: newCandidates, icon: UserPlus },
    { label: t("admin.kpi.interviews"), value: interviews, icon: CalendarCheck },
    { label: t("admin.kpi.hires"), value: hires, icon: UserCheck },
  ];

  const funnel = stageOrder
    .filter((stage) => stage !== "rejected")
    .map((stage) => ({
      stage,
      count: candidates.filter((c) => c.stage === stage).length,
    }));
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <AdminLayout title={t("admin.title")} description={t("admin.demoNote")}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-border bg-card p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <p className="min-w-0 text-xs text-muted-foreground">{kpi.label}</p>
              <kpi.icon className="h-4 w-4 shrink-0 text-accent" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold">{kpiLoading && kpi.value === null ? "—" : (kpi.value ?? "—")}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-base font-semibold">{t("admin.chart.title")}</h2>
          <div className="mt-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyApplications}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="applications" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-base font-semibold">{t("admin.funnel.title")}</h2>
          <ul className="mt-5 space-y-4">
            {funnel.map((item) => (
              <li key={item.stage}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tr(stageLabels[item.stage])}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${(item.count / maxFunnel) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">{t("admin.activity.title")}</h2>
        <ul className="mt-4 divide-y divide-border">
          {activityItems.map((item) => (
            <li key={`${item.type}-${item.at}-${item.text.en}`} className="flex items-start gap-4 py-3">
              <Badge variant="secondary" className="shrink-0">
                {new Intl.DateTimeFormat(language, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.at))}
              </Badge>
              <p className="min-w-0 text-sm text-muted-foreground">{tr(item.text)}</p>
            </li>
          ))}
        </ul>
      </div>
    </AdminLayout>
  );
}
