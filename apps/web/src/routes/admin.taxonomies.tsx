import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { LocalizedField } from "@/components/admin/LocalizedInput";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n, type Localized, type TranslationKey } from "@/lib/i18n";
import { type Taxonomies, type TaxonomyKey } from "@/lib/taxonomy-store";
import {
  createTaxonomyItem,
  deleteTaxonomyItem,
  fetchAdminTaxonomies,
  moveTaxonomyItem,
  updateTaxonomyItem,
} from "@/services/admin-taxonomies.api";
import { requireAdminSession } from "@/lib/admin-route-guard";
import { createRouteMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/admin/taxonomies")({
  beforeLoad: ({ location }) => requireAdminSession(location.pathname),
  head: createRouteMeta({
    titleKey: "admin.taxonomies.meta.title",
    descriptionKey: "admin.taxonomies.meta.description",
    ogDescriptionKey: "admin.taxonomies.meta.ogDescription",
    noIndex: true,
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
  const [taxonomies, setTaxonomies] = useState<Taxonomies>({
    departments: [],
    workTypes: [],
    salaries: [],
    experiences: [],
    locations: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState(builtInGroups[0]!.key);
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set());
  const [nextDraftId, setNextDraftId] = useState(0);

  const loadTaxonomies = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchAdminTaxonomies();
      setTaxonomies(result.taxonomies);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không tải được danh mục.", en: "Failed to load taxonomies." }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [tr]);

  useEffect(() => {
    void loadTaxonomies();
  }, [loadTaxonomies]);

  const addItem = (key: string) => {
    const id = `draft-${nextDraftId}`;
    const item = { id, label: { vi: "", en: "" } };
    setNextDraftId((current) => current + 1);
    setDraftIds((current) => new Set(current).add(id));
    setTaxonomies((current) => ({ ...current, [key]: [...current[key as TaxonomyKey], item] }));
  };

  const updateItem = (key: string, id: string, label: Localized) => {
    const update = (item: Taxonomies[TaxonomyKey]) => item.map((entry) =>
      entry.id === id ? { ...entry, label } : entry,
    );
    setTaxonomies((current) => ({ ...current, [key]: update(current[key as TaxonomyKey]) }));
  };

  const saveItem = async (key: string, id: string, label: Localized) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const saved = draftIds.has(id)
        ? await createTaxonomyItem(key, label)
        : await updateTaxonomyItem(id, label);
      const replace = (items: Taxonomies[TaxonomyKey]) => items.map((item) => item.id === id ? saved : item);
      setTaxonomies((current) => ({ ...current, [key]: replace(current[key as TaxonomyKey]) }));
      setDraftIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tr({ vi: "Không lưu được mục.", en: "Failed to save item." }));
    } finally {
      setIsSaving(false);
    }
  };

  const moveItem = async (key: string, id: string, direction: -1 | 1) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await moveTaxonomyItem(id, direction);
      await loadTaxonomies();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không di chuyển được mục.", en: "Failed to move item." }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = async (key: string, id: string) => {
    if (draftIds.has(id)) {
      setTaxonomies((current) => ({
        ...current,
        [key]: current[key as TaxonomyKey].filter((item) => item.id !== id),
      }));
      setDraftIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      await deleteTaxonomyItem(id);
      await loadTaxonomies();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không xoá được mục.", en: "Failed to delete item." }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const groups = builtInGroups.map((group) => ({
    key: group.key,
    title: t(group.label),
    field: group.field,
    items: taxonomies[group.key],
  }));

  return (
    <AdminLayout
      title={t("taxonomy.title")}
      description={t("taxonomy.note")}
    >
      {isLoading && (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {tr({ vi: "Đang tải danh mục...", en: "Loading taxonomies..." })}
        </div>
      )}
      {!isLoading && groups.length > 0 && <Tabs value={activeGroup} onValueChange={setActiveGroup}>
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
                  <Button size="sm" variant="outline" onClick={() => addItem(group.key)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}{" "}
                    {t("taxonomy.add")}
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
                    const used = entry.usageCount ?? 0;
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
                              disabled={isSaving || draftIds.has(entry.id) || index === 0}
                              onClick={() => void moveItem(group.key, entry.id, -1)}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={t("taxonomy.moveDown")}
                              disabled={isSaving || draftIds.has(entry.id) || index === list.length - 1}
                              onClick={() => void moveItem(group.key, entry.id, 1)}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={tr({ vi: "Lưu mục", en: "Save item" })}
                              disabled={isSaving || (!draftIds.has(entry.id) && !entry.label.vi.trim() && !entry.label.en.trim())}
                              onClick={() => void saveItem(group.key, entry.id, entry.label)}
                            >
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={t("taxonomy.remove")}
                              disabled={isSaving}
                              onClick={() => void removeItem(group.key, entry.id)}
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
      </Tabs>}
    </AdminLayout>
  );
}
