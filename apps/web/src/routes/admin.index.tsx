import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, CalendarCheck, UserPlus, UserCheck, CalendarDays, RefreshCw, ChevronDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { stageLabels, stageOrder } from "@/data/candidates";
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

function getMonthEnd(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
}

function AdminOverview() {
  const { t, tr, language } = useI18n();
  const [activityItems, setActivityItems] = useState<AdminActivity[]>([]);
  const [applicationCounts, setApplicationCounts] = useState<{ jobId: string; title: { vi: string; en: string }; applications: number }[]>([]);
  const [funnelCounts, setFunnelCounts] = useState<Record<string, number>>({});
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [draftDateRange, setDraftDateRange] = useState(() => {
    const month = new Date().toISOString().slice(0, 7);
    return { from: `${month}-01`, to: getMonthEnd(month) };
  });
  const [dateRange, setDateRange] = useState(draftDateRange);
  const [chartLoading, setChartLoading] = useState(true);
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

  useEffect(() => {
    let active = true;
    setChartLoading(true);
    void Promise.all([
      adminCandidateApi.getApplicationsByJob(dateRange.from, dateRange.to),
      adminCandidateApi.getRecruitmentFunnel(dateRange.from, dateRange.to),
    ]).then(([applications, funnel]) => {
      if (!active) return;
      setApplicationCounts(applications);
      setFunnelCounts(Object.fromEntries(funnel.map((item) => [item.status.toLowerCase(), item.count])));
    }).catch(() => {
      if (!active) return;
      setApplicationCounts([]);
      setFunnelCounts({});
    }).finally(() => { if (active) setChartLoading(false); });
    return () => { active = false; };
  }, [dateRange]);

  const { openJobs, newCandidates, interviews, hires } = kpiValues;

  const kpis = [
    { label: t("admin.kpi.openJobs"), value: openJobs, icon: Briefcase },
    { label: t("admin.kpi.newCandidates"), value: newCandidates, icon: UserPlus },
    { label: t("admin.kpi.interviews"), value: interviews, icon: CalendarCheck },
    { label: t("admin.kpi.hires"), value: hires, icon: UserCheck },
  ];

  const funnel = stageOrder.map((stage) => ({
    stage,
    count: funnelCounts[stage] ?? 0,
  }));
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);
  const visibleApplicationCounts = applicationCounts.filter((item) => item.applications > 0);

  return (
    <AdminLayout title={t("admin.title")} description={t("admin.subtitle")}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-md">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <p className="min-w-0 text-xs text-muted-foreground">{kpi.label}</p>
              <kpi.icon className="h-4 w-4 shrink-0 text-accent" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold">{kpiLoading && kpi.value === null ? "—" : (kpi.value ?? "—")}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="col-span-full flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card px-4 py-4 shadow-soft sm:gap-4 sm:px-5">
          <label className="grid min-w-0 flex-1 basis-[220px] gap-1 text-[11px] font-medium text-muted-foreground">
            {t("admin.chart.month")}
            <span className="relative flex h-10 items-center rounded-lg border border-border bg-background">
              <CalendarDays className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input className="h-full min-w-0 flex-1 appearance-none bg-transparent px-2 text-sm font-medium text-foreground outline-none" type="month" value={selectedMonth} aria-label={t("admin.chart.month")} onChange={(event) => {
                const month = event.target.value;
                if (!month) return;
                setSelectedMonth(month);
                setDraftDateRange({ from: `${month}-01`, to: getMonthEnd(month) });
              }} />
              <ChevronDown className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </span>
          </label>
          <div className="hidden h-10 w-px bg-border sm:block" aria-hidden="true" />
          <fieldset className="grid min-w-0 flex-1 basis-[290px] gap-1 border-0 p-0">
            <legend className="text-[11px] font-medium text-muted-foreground">{t("admin.chart.dateRange")}</legend>
            <div className="flex h-10 min-w-0 items-center rounded-lg border border-border bg-background">
              <CalendarDays className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-1 px-2">
                <input className="h-8 min-w-0 w-full cursor-pointer rounded-md border-0 bg-transparent px-1 text-xs font-medium text-foreground outline-none transition-colors focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring" type="date" min={`${selectedMonth}-01`} max={getMonthEnd(selectedMonth)} value={draftDateRange.from} aria-label={t("admin.chart.from")} onChange={(event) => { const from = event.target.value; if (from && from <= draftDateRange.to) setDraftDateRange((range) => ({ ...range, from })); }} />
                <input className="h-8 min-w-0 w-full cursor-pointer rounded-md border-0 bg-transparent px-1 text-xs font-medium text-foreground outline-none transition-colors focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring" type="date" min={`${selectedMonth}-01`} max={getMonthEnd(selectedMonth)} value={draftDateRange.to} aria-label={t("admin.chart.to")} onChange={(event) => { const to = event.target.value; if (to && to >= draftDateRange.from) setDraftDateRange((range) => ({ ...range, to })); }} />
              </div>
            </div>
          </fieldset>
          <button type="button" disabled={chartLoading || draftDateRange.from > draftDateRange.to} onClick={() => setDateRange(draftDateRange)} className="ml-auto inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${chartLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            {t("admin.chart.apply")}
          </button>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="font-display text-base font-semibold">{t("admin.chart.title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.chart.subtitle")}</p>
          <div className="mt-5 h-72 w-full" aria-busy={chartLoading}>
            {chartLoading ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{t("admin.chart.loading")}</p> : applicationCounts.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{t("admin.chart.empty")}</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visibleApplicationCounts} margin={{ top: 24, right: 8, bottom: 38, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="jobId" interval={0} angle={-25} textAnchor="end" height={70} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} tickFormatter={(jobId) => { const title = visibleApplicationCounts.find((item) => item.jobId === jobId)?.title; return title ? tr(title) : ""; }} />
                  <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip labelFormatter={(jobId) => { const title = visibleApplicationCounts.find((item) => item.jobId === jobId)?.title; return title ? tr(title) : ""; }} formatter={(value) => [value, t("admin.chart.applicants")]} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", color: "var(--popover-foreground)" }} />
                  <Bar dataKey="applications" name={t("admin.chart.applicants")} fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={56}>
                    <LabelList dataKey="applications" position="top" fill="var(--foreground)" fontSize={12} formatter={(value: number | string) => (Number(value) === 0 ? "" : value)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5" aria-busy={chartLoading}>
          <h2 className="font-display text-base font-semibold">{t("admin.funnel.title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.funnel.subtitle")}</p>
          <ul className="mt-5 space-y-4">
            {funnel.map((item) => (
              <li key={item.stage}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tr(stageLabels[item.stage])}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-accent transition-[width] duration-300"
                    style={{ width: `${(item.count / maxFunnel) * 100}%` }}
                    role="meter"
                    aria-label={tr(stageLabels[item.stage])}
                    aria-valuemin={0}
                    aria-valuemax={maxFunnel}
                    aria-valuenow={item.count}
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
