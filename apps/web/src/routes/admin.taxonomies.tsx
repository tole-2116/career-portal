import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { LocalizedField } from "@/components/admin/LocalizedInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Job } from "@/data/jobs";
import { useI18n, type Localized, type TranslationKey } from "@/lib/i18n";
import { useJobs } from "@/lib/jobs-store";
import { useTaxonomies, type TaxonomyKey } from "@/lib/taxonomy-store";

export const Route = createFileRoute("/admin/taxonomies")({
  head: () => ({
    meta: [
      { title: "Danh mục tuyển dụng — TalentHub HR" },
      {
        name: "description",
        content:
          "Khai báo danh mục hình thức làm việc, mức lương, kinh nghiệm và nơi làm việc dùng chung cho tin tuyển dụng.",
      },
      { property: "og:title", content: "Danh mục tuyển dụng — TalentHub HR" },
      {
        property: "og:description",
        content: "Quản lý danh mục hình thức, mức lương, kinh nghiệm và nơi làm việc.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTaxonomiesPage,
});

const builtInGroups: { key: TaxonomyKey; label: TranslationKey; field: keyof Job }[] = [
  { key: "departments", label: "taxonomy.departments", field: "department" },
  { key: "workTypes", label: "taxonomy.workTypes", field: "workType" },
  { key: "salaries", label: "taxonomy.salaries", field: "salary" },
  { key: "experiences", label: "taxonomy.experiences", field: "experience" },
  { key: "locations", label: "taxonomy.locations", field: "locations" },
];

function AdminTaxonomiesPage() {
  const { t, tr } = useI18n();
  const { jobs } = useJobs();
  const {
    taxonomies,
    customGroups,
    addItem,
    updateItem,
    moveItem,
    removeItem,
    addGroup,
    removeGroup,
    resetTaxonomies,
  } = useTaxonomies();

  const [newGroup, setNewGroup] = useState<Localized | null>(null);
  const [pendingGroup, setPendingGroup] = useState<string | null>(null);

  const groups = [
    ...builtInGroups.map((group) => ({
      key: group.key as string,
      title: t(group.label),
      field: group.field as keyof Job | null,
      items: taxonomies[group.key],
      builtIn: true,
    })),
    ...customGroups.map((group) => ({
      key: group.key,
      title: tr(group.label) || tr({ vi: "Nhóm mới", en: "New group" }),
      field: null,
      items: group.items,
      builtIn: false,
    })),
  ];

  const usageCount = (field: keyof Job | null, en: string, vi: string) => {
    if (!field) return 0;
    return jobs.filter((job) => {
      const raw = job[field] as unknown;
      const values = (Array.isArray(raw) ? raw : [raw]) as (
        | { vi?: string; en?: string }
        | undefined
      )[];
      return values.some((value) =>
        value ? (en && value.en === en) || (vi && value.vi === vi) : false,
      );
    }).length;
  };

  return (
    <AdminLayout
      title={t("taxonomy.title")}
      description={t("taxonomy.note")}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setNewGroup({ vi: "", en: "" })}>
            <Plus className="mr-1.5 h-4 w-4" />
            {tr({ vi: "Thêm nhóm danh mục mới", en: "New catalogue group" })}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              resetTaxonomies();
              toast.success(t("taxonomy.resetDone"));
            }}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> {t("taxonomy.reset")}
          </Button>
        </div>
      }
    >
      <Tabs defaultValue={groups[0]!.key}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
          {groups.map((group) => (
            <TabsTrigger key={group.key} value={group.key} className="min-w-0 truncate">
              {group.title}
              <span className="ml-1.5 shrink-0 text-xs text-muted-foreground">{group.items.length}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((group) => {
          const list = group.items;
          return (
            <TabsContent
              key={group.key}
              value={group.key}
              className="mt-5 rounded-xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-semibold">{group.title}</h2>
                <div className="flex items-center gap-2">
                  {!group.builtIn && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingGroup(group.key)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      {tr({ vi: "Xóa nhóm", en: "Delete group" })}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => addItem(group.key)}>
                    <Plus className="mr-1.5 h-4 w-4" /> {t("taxonomy.add")}
                  </Button>
                </div>
              </div>

              {list.length === 0 ? (
                <p className="mt-4 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {t("taxonomy.empty")}
                </p>
              ) : (
                <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((entry, index) => {
                    const used = usageCount(group.field, entry.label.en, entry.label.vi);
                    return (
                      <li key={entry.id} className="rounded-lg border border-border p-3">
                        <LocalizedField
                          label={group.title}
                          value={entry.label}
                          onChange={(next) => updateItem(group.key, entry.id, next)}
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {group.field ? `${used} ${t("taxonomy.usage")}` : ""}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={t("taxonomy.moveUp")}
                              disabled={index === 0}
                              onClick={() => moveItem(group.key, entry.id, -1)}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={t("taxonomy.moveDown")}
                              disabled={index === list.length - 1}
                              onClick={() => moveItem(group.key, entry.id, 1)}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={t("taxonomy.remove")}
                              onClick={() => removeItem(group.key, entry.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={newGroup !== null} onOpenChange={(open) => !open && setNewGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr({ vi: "Nhóm danh mục mới", en: "New catalogue group" })}</DialogTitle>
          </DialogHeader>
          {newGroup && (
            <LocalizedField
              label={tr({ vi: "Tên nhóm", en: "Group name" })}
              value={newGroup}
              onChange={setNewGroup}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGroup(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (!newGroup || !(newGroup.vi || newGroup.en)) return;
                addGroup(newGroup);
                setNewGroup(null);
                toast.success(tr({ vi: "Đã thêm nhóm danh mục.", en: "Group added." }));
              }}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingGroup !== null} onOpenChange={(open) => !open && setPendingGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tr({ vi: "Xóa nhóm danh mục này?", en: "Delete this group?" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tr({
                vi: "Toàn bộ mục con trong nhóm sẽ bị xóa và không khôi phục được.",
                en: "All items inside this group will be removed permanently.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingGroup) removeGroup(pendingGroup);
                setPendingGroup(null);
                toast.success(tr({ vi: "Đã xóa nhóm.", en: "Group deleted." }));
              }}
            >
              {tr({ vi: "Xóa", en: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
