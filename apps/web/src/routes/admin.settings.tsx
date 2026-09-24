import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ExternalLink,
  GripVertical,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LocalizedField } from "@/components/admin/LocalizedInput";
import { brandInitials } from "@/components/site/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getIcon, iconNames } from "@/data/homeContent";
import {
  aboutLibrary,
  cultureLibrary,
  heroLibrary,
  logoLibrary,
  type MediaItem,
} from "@/data/media";
import { useI18n, type Localized } from "@/lib/i18n";
import {
  contrastRatio,
  defaultAbout,
  defaultSections,
  defaultSiteConfig,
  layoutPresets,
  palettePresets,
  readableOn,
  useSiteConfig,
  type AboutConfig,
  type AboutWidgetKey,
  type AboutWidgetStyle,
  type HomeItemConfig,
  type HomeWidgetKey,
  type LayoutId,
  type SiteConfig,
  type SiteSections,
  type SurfaceTone,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

type Tr = (value: Localized) => string;

function ContrastNotice({ primary, accent, tr }: { primary: string; accent: string; tr: Tr }) {
  const primaryRatio = contrastRatio(primary, readableOn(primary));
  const accentRatio = contrastRatio(accent, readableOn(accent));
  const accentOnWhite = contrastRatio(accent, "#ffffff");
  const issues: string[] = [];
  if (primaryRatio < 4.5)
    issues.push(
      tr({
        vi: "Màu chính khó đọc chữ ở trên — hãy chọn tông đậm hơn.",
        en: "Text on the primary colour is hard to read — pick a darker tone.",
      }),
    );
  if (accentRatio < 4.5)
    issues.push(
      tr({
        vi: "Màu nhấn khó đọc chữ ở trên — hãy chỉnh độ sáng.",
        en: "Text on the accent colour is hard to read — adjust its lightness.",
      }),
    );
  if (accentOnWhite < 2.2)
    issues.push(
      tr({
        vi: "Màu nhấn quá nhạt trên nền trắng, các liên kết sẽ mờ.",
        en: "The accent is too light on white; links will look washed out.",
      }),
    );
  if (issues.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground">
        {tr({
          vi: "Cặp màu đạt độ tương phản tốt.",
          en: "This colour pair has good contrast.",
        })}
      </p>
    );
  }
  return (
    <div className="mt-4 rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-foreground">
      <p className="font-medium">{tr({ vi: "Cảnh báo tương phản", en: "Contrast warning" })}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}

function BrandPreviewHome({ primary, accent, tr }: { primary: string; accent: string; tr: Tr }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="p-4" style={{ backgroundColor: primary, color: readableOn(primary) }}>
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: accent, color: readableOn(accent) }}
        >
          {tr({ vi: "Chúng tôi đang tuyển", en: "We are hiring" })}
        </span>
        <p className="mt-2 font-display text-lg font-semibold leading-snug">
          {tr({ vi: "Trang chủ tuyển dụng", en: "Career homepage" })}
        </p>
        <div className="mt-3 flex gap-2">
          <span className="h-6 flex-1 rounded-md bg-card/90" />
          <span
            className="h-6 w-20 rounded-md"
            style={{ backgroundColor: accent, color: readableOn(accent) }}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 bg-surface p-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md border border-border bg-card p-2">
            <span className="block h-1.5 w-8 rounded-sm" style={{ backgroundColor: accent }} />
            <span className="mt-2 block h-1.5 w-full rounded-sm bg-muted" />
            <span className="mt-1 block h-1.5 w-2/3 rounded-sm bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandPreviewJobs({ primary, accent, tr }: { primary: string; accent: string; tr: Tr }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="border-b border-border px-3 py-2">
        <p className="font-display text-sm font-semibold" style={{ color: primary }}>
          {tr({ vi: "Trang việc làm", en: "Jobs page" })}
        </p>
      </div>
      <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 p-3">
        <div className="space-y-1.5 rounded-md border border-border bg-surface p-2">
          <span className="block h-1.5 w-full rounded-sm bg-muted" />
          <span className="block h-1.5 w-3/4 rounded-sm bg-muted" />
          <span className="block h-1.5 w-2/3 rounded-sm bg-muted" />
        </div>
        <div className="grid gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-md border border-border bg-card p-2 shadow-soft">
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ backgroundColor: accent, color: readableOn(accent) }}
                >
                  {tr({ vi: "Nổi bật", en: "Featured" })}
                </span>
                <span className="h-1.5 w-16 rounded-sm bg-muted" />
              </div>
              <span
                className="mt-2 block h-2 w-3/4 rounded-sm"
                style={{ backgroundColor: primary }}
              />
              <span className="mt-1.5 block h-1.5 w-full rounded-sm bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Cấu hình giao diện — TalentHub HR" },
      {
        name: "description",
        content:
          "Chọn bố cục trang chủ, bảng màu, hình ảnh và nội dung hiển thị cho cổng việc làm.",
      },
      { property: "og:title", content: "Cấu hình giao diện — TalentHub HR" },
      {
        property: "og:description",
        content: "Chọn bố cục trang chủ, bảng màu, hình ảnh và nội dung hiển thị.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettings,
});

function LayoutThumb({ id }: { id: LayoutId }) {
  const bar = "rounded-sm bg-muted-foreground/25";
  const accent = "rounded-sm bg-accent/70";

  if (id === "split") {
    return (
      <div className="grid h-24 grid-cols-2 gap-1.5 rounded-md bg-surface p-2">
        <div className="space-y-1.5">
          <div className={cn(bar, "h-2 w-4/5")} />
          <div className={cn(bar, "h-2 w-3/5")} />
          <div className={cn(accent, "h-3 w-full")} />
        </div>
        <div className="rounded-sm bg-primary/30" />
      </div>
    );
  }
  if (id === "bento") {
    return (
      <div className="grid h-24 grid-cols-3 grid-rows-3 gap-1.5 rounded-md bg-surface p-2">
        <div className="col-span-2 row-span-2 rounded-sm bg-muted-foreground/20" />
        <div className="rounded-sm bg-primary/30" />
        <div className={accent} />
        <div className="rounded-sm bg-muted-foreground/20" />
        <div className="rounded-sm bg-muted-foreground/20" />
        <div className="rounded-sm bg-muted-foreground/20" />
      </div>
    );
  }
  if (id === "editorial") {
    return (
      <div className="flex h-24 flex-col gap-2 rounded-md bg-surface p-3">
        <div className={cn(bar, "h-3 w-4/5")} />
        <div className={cn(bar, "h-1.5 w-2/5")} />
        <div className="mt-auto space-y-1">
          <div className={cn(bar, "h-1.5 w-full")} />
          <div className={cn(bar, "h-1.5 w-full")} />
          <div className={cn(accent, "h-1.5 w-1/3")} />
        </div>
      </div>
    );
  }
  if (id === "spotlight") {
    return (
      <div className="flex h-24 flex-col gap-1.5 rounded-md bg-primary p-2">
        <div className={cn(accent, "h-1.5 w-1/4")} />
        <div className="h-3 w-3/4 rounded-sm bg-primary-foreground/70" />
        <div className="h-1.5 w-1/2 rounded-sm bg-primary-foreground/30" />
        <div className="mt-auto grid grid-cols-3 gap-1.5">
          <div className="h-5 rounded-sm bg-primary-foreground/10" />
          <div className="h-5 rounded-sm bg-primary-foreground/10" />
          <div className="h-5 rounded-sm bg-primary-foreground/10" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-24 flex-col gap-1.5 rounded-md bg-surface p-2">
      <div className="flex h-11 flex-col items-center justify-center gap-1 rounded-sm bg-primary/30">
        <div className="h-1.5 w-2/3 rounded-sm bg-background/70" />
        <div className="h-2 w-1/2 rounded-sm bg-background/80" />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="h-5 rounded-sm bg-muted-foreground/20" />
        <div className="h-5 rounded-sm bg-muted-foreground/20" />
        <div className="h-5 rounded-sm bg-muted-foreground/20" />
      </div>
    </div>
  );
}

function ImagePicker({
  label,
  library,
  value,
  onChange,
}: {
  label: string;
  library: MediaItem[];
  value: string;
  onChange: (url: string) => void;
}) {
  const { t, tr } = useI18n();

  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {library.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.url)}
            className={cn(
              "group overflow-hidden rounded-lg border-2 text-left transition-colors",
              value === item.url ? "border-accent" : "border-border hover:border-primary/40",
            )}
          >
            <img
              src={item.url}
              alt={tr(item.label)}
              loading="lazy"
              className="h-20 w-full bg-surface object-contain sm:object-cover"
            />
            <span className="block truncate px-2 py-1.5 text-xs text-muted-foreground">
              {tr(item.label)}
            </span>
          </button>
        ))}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("settings.images.customUrl")}
        className="mt-3"
      />
    </div>
  );
}

function CopyField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: Localized;
  onChange: (next: Localized) => void;
  multiline?: boolean;
}) {
  return (
    <LocalizedField
      label={label}
      value={value}
      onChange={onChange}
      {...(multiline ? { multiline: true } : {})}
    />
  );
}

function ContentBlock({
  title,
  enabled,
  onToggle,
  widgetKey,
  widgetStyle,
  orderIndex,
  onWidgetStyle,
  onReset,
  children,
}: {
  title: string;
  enabled?: boolean;
  onToggle?: (next: boolean) => void;
  widgetKey?: WidgetKey;
  widgetStyle?: AboutWidgetStyle;
  orderIndex?: number;
  onWidgetStyle?: (next: Partial<AboutWidgetStyle>) => void;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  const { t, tr } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const sortable = useSortable({ id: widgetKey ?? title, disabled: !widgetKey });
  const sortableStyle = widgetKey
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        order: orderIndex ?? 0,
      }
    : undefined;

  return (
    <section
      ref={sortable.setNodeRef}
      style={sortableStyle}
      className={cn(
        "rounded-lg border border-border bg-card p-5",
        sortable.isDragging && "z-10 shadow-lg",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {widgetKey && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="cursor-grab touch-none"
              aria-label={tr({ vi: "Kéo để sắp xếp", en: "Drag to reorder" })}
              {...sortable.attributes}
              {...sortable.listeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
          )}
          <h2 className="truncate font-display text-base font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {onToggle && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {t("settings.block.show")}
              <Switch checked={!!enabled} onCheckedChange={onToggle} />
            </label>
          )}
          {onReset && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title={tr({ vi: "Khôi phục mặc định", en: "Restore defaults" })}
                  aria-label={tr({ vi: "Khôi phục mặc định", en: "Restore defaults" })}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {tr({ vi: "Khôi phục nội dung mặc định?", en: "Restore default content?" })}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {tr({
                      vi: `Toàn bộ chữ, mục con và kiểu hiển thị của khối «${title}» sẽ trở về bản gốc. Nội dung bạn đã tùy chỉnh trong khối này sẽ mất.`,
                      en: `All text, items and display style of the “${title}” block will return to the original version. Your customisations in this block will be lost.`,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tr({ vi: "Hủy", en: "Cancel" })}</AlertDialogCancel>
                  <AlertDialogAction onClick={onReset}>
                    {tr({ vi: "Khôi phục", en: "Restore" })}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {widgetKey && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setExpanded((v) => !v)}
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
              />
            </Button>
          )}
        </div>
      </div>
      {widgetStyle && onWidgetStyle && expanded && (
        <div className="mt-5 grid gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
          <WidgetSelect
            label={tr({ vi: "Bố cục", en: "Layout" })}
            value={widgetStyle.layout}
            options={widgetLayoutOptions[widgetKey ?? "hero"] ?? []}
            onChange={(layout) => onWidgetStyle({ layout })}
          />
          <WidgetSelect
            label={tr({ vi: "Màu nền", en: "Background" })}
            value={widgetStyle.tone}
            options={[
              ["white", tr({ vi: "Trắng", en: "White" })],
              ["soft", tr({ vi: "Nền nhẹ", en: "Soft" })],
              ["brand", tr({ vi: "Thương hiệu", en: "Brand" })],
            ]}
            onChange={(tone) => onWidgetStyle({ tone: tone as AboutWidgetStyle["tone"] })}
          />
          <WidgetSelect
            label={tr({ vi: "Khoảng cách", en: "Spacing" })}
            value={widgetStyle.spacing}
            options={[
              ["compact", tr({ vi: "Gọn", en: "Compact" })],
              ["normal", tr({ vi: "Tiêu chuẩn", en: "Standard" })],
              ["spacious", tr({ vi: "Rộng", en: "Spacious" })],
            ]}
            onChange={(spacing) =>
              onWidgetStyle({ spacing: spacing as AboutWidgetStyle["spacing"] })
            }
          />
        </div>
      )}
      {(!widgetKey || expanded) && <div className="mt-5 grid gap-5">{children}</div>}
    </section>
  );
}

type WidgetKey = AboutWidgetKey | HomeWidgetKey;

const widgetLayoutOptions: Record<WidgetKey, [string, string][]> = {
  stats: [
    ["row", "Một hàng"],
    ["grid", "Dạng lưới"],
  ],
  culture: [
    ["2", "2 cột"],
    ["3", "3 cột"],
    ["4", "4 cột"],
  ],
  benefits: [
    ["2", "2 cột"],
    ["3", "3 cột"],
    ["4", "4 cột"],
  ],
  jobs: [
    ["grid", "Dạng lưới"],
    ["list", "Danh sách"],
  ],
  cta: [
    ["row", "Hàng ngang"],
    ["center", "Căn giữa"],
  ],
  hero: [
    ["left", "Căn trái"],
    ["center", "Căn giữa"],
  ],
  story: [
    ["image-right", "Ảnh bên phải"],
    ["image-left", "Ảnh bên trái"],
    ["full", "Toàn chiều rộng"],
  ],
  timeline: [
    ["grid", "Dạng lưới"],
    ["vertical", "Dòng thời gian dọc"],
  ],
  values: [
    ["2", "2 cột"],
    ["3", "3 cột"],
    ["4", "4 cột"],
  ],
  leaders: [
    ["2", "2 cột"],
    ["3", "3 cột"],
    ["4", "4 cột"],
  ],
  gallery: [
    ["featured", "Ảnh nổi bật"],
    ["grid", "Lưới đều"],
    ["strip", "Dải ảnh"],
  ],
  contact: [
    ["grid", "Dạng lưới"],
    ["row", "Hàng gọn"],
  ],
};

function WidgetSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([id, text]) => (
            <SelectItem key={id} value={id}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ItemRow({
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("settings.item.up")}
          disabled={index === 0}
          onClick={() => onMove(-1)}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("settings.item.down")}
          disabled={index === total - 1}
          onClick={() => onMove(1)}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("settings.item.remove")}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function IconSelect({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const { t } = useI18n();
  const Current = getIcon(value);

  return (
    <div>
      <Label className="text-sm font-medium">{t("settings.field.icon")}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-2 w-full sm:w-56">
          <SelectValue>
            <span className="flex items-center gap-2">
              <Current className="h-4 w-4 text-accent" />
              {value}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {iconNames.map((name) => {
            const Icon = getIcon(name);
            return (
              <SelectItem key={name} value={name}>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-accent" />
                  {name}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return next;
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item!);
  return next;
}

function newItem(): HomeItemConfig {
  return {
    id: `item-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    icon: "sparkles",
    title: { vi: "Mục mới", en: "New item" },
    body: { vi: "", en: "" },
  };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

/** Editor for every block of the public "About us" page. */
function AboutPanel({
  about,
  onChange,
  onSave,
}: {
  about: AboutConfig;
  onChange: (next: AboutConfig) => void;
  onSave: () => void;
}) {
  const { t, tr } = useI18n();
  const set = <K extends keyof AboutConfig>(key: K, patch: Partial<AboutConfig[K]>) =>
    onChange({ ...about, [key]: { ...about[key], ...patch } });
  const setStyle = (key: AboutWidgetKey, patch: Partial<AboutWidgetStyle>) =>
    onChange({ ...about, styles: { ...about.styles, [key]: { ...about.styles[key], ...patch } } });
  const resetWidget = (key: AboutWidgetKey) => {
    const base = structuredClone(defaultAbout);
    onChange({
      ...about,
      [key]: base[key],
      styles: { ...about.styles, [key]: base.styles[key] },
    });
    toast.success(tr({ vi: "Đã khôi phục khối này.", en: "Block restored." }));
  };
  const widgetProps = (key: AboutWidgetKey) => ({
    widgetKey: key,
    widgetStyle: about.styles[key],
    orderIndex: about.order.indexOf(key),
    onWidgetStyle: (patch: Partial<AboutWidgetStyle>) => setStyle(key, patch),
    onReset: () => resetWidget(key),
  });
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = about.order.indexOf(active.id as AboutWidgetKey);
    const to = about.order.indexOf(over.id as AboutWidgetKey);
    if (from >= 0 && to >= 0) onChange({ ...about, order: arrayMove(about.order, from, to) });
  };

  const onLeaderPhoto = (id: string, file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error(tr({ vi: "Chỉ nhận ảnh PNG, JPG hoặc WEBP.", en: "Only PNG, JPG or WEBP." }));
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error(tr({ vi: "Ảnh phải nhỏ hơn 1MB.", en: "The image must be under 1MB." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set("leaders", {
        items: about.leaders.items.map((it) =>
          it.id === id ? { ...it, photo: String(reader.result) } : it,
        ),
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-xs text-muted-foreground">
          {tr({
            vi: "Mọi thay đổi tại đây hiển thị ngay trên trang Về chúng tôi sau khi lưu.",
            en: "Everything here shows on the public About page once saved.",
          })}
        </p>
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4" />
          {tr({ vi: "Lưu thay đổi", en: "Save changes" })}
        </Button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={about.order} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            <ContentBlock
              {...widgetProps("hero")}
              title={tr({ vi: "Ảnh bìa", en: "Cover" })}
              enabled={about.hero.enabled}
              onToggle={(enabled) => set("hero", { enabled })}
            >
              <CopyField
                label={t("settings.field.eyebrow")}
                value={about.hero.eyebrow}
                onChange={(eyebrow) => set("hero", { eyebrow })}
              />
              <CopyField
                label={t("settings.field.title")}
                value={about.hero.title}
                onChange={(title) => set("hero", { title })}
              />
              <CopyField
                label={t("settings.field.description")}
                value={about.hero.subtitle}
                multiline
                onChange={(subtitle) => set("hero", { subtitle })}
              />
              <ImagePicker
                label={tr({ vi: "Ảnh bìa", en: "Cover image" })}
                library={aboutLibrary}
                value={about.hero.image}
                onChange={(image) => set("hero", { image })}
              />
              <div className="grid gap-4">
                {about.hero.stats.map((stat, index) => (
                  <ItemRow
                    key={stat.id}
                    index={index}
                    total={about.hero.stats.length}
                    onMove={(dir) => set("hero", { stats: move(about.hero.stats, index, dir) })}
                    onRemove={() =>
                      set("hero", { stats: about.hero.stats.filter((it) => it.id !== stat.id) })
                    }
                  >
                    <div>
                      <Label className="text-sm font-medium">{t("settings.field.value")}</Label>
                      <Input
                        value={stat.value}
                        className="mt-2 w-40"
                        onChange={(e) =>
                          set("hero", {
                            stats: about.hero.stats.map((it) =>
                              it.id === stat.id ? { ...it, value: e.target.value } : it,
                            ),
                          })
                        }
                      />
                    </div>
                    <CopyField
                      label={t("settings.field.label")}
                      value={stat.label}
                      onChange={(label) =>
                        set("hero", {
                          stats: about.hero.stats.map((it) =>
                            it.id === stat.id ? { ...it, label } : it,
                          ),
                        })
                      }
                    />
                  </ItemRow>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="justify-self-start"
                  onClick={() =>
                    set("hero", {
                      stats: [
                        ...about.hero.stats,
                        { id: uid("stat"), value: "0", label: { vi: "Mục mới", en: "New item" } },
                      ],
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t("settings.item.add")}
                </Button>
              </div>
            </ContentBlock>

            <ContentBlock
              {...widgetProps("story")}
              title={tr({ vi: "Câu chuyện", en: "Story" })}
              enabled={about.story.enabled}
              onToggle={(enabled) => set("story", { enabled })}
            >
              <CopyField
                label={t("settings.field.title")}
                value={about.story.title}
                onChange={(title) => set("story", { title })}
              />
              {about.story.paragraphs.map((paragraph, index) => (
                <ItemRow
                  key={`p-${index}`}
                  index={index}
                  total={about.story.paragraphs.length}
                  onMove={(dir) =>
                    set("story", { paragraphs: move(about.story.paragraphs, index, dir) })
                  }
                  onRemove={() =>
                    set("story", {
                      paragraphs: about.story.paragraphs.filter((_, i) => i !== index),
                    })
                  }
                >
                  <CopyField
                    label={`${tr({ vi: "Đoạn", en: "Paragraph" })} ${String(index + 1)}`}
                    value={paragraph}
                    multiline
                    onChange={(next) =>
                      set("story", {
                        paragraphs: about.story.paragraphs.map((p, i) => (i === index ? next : p)),
                      })
                    }
                  />
                </ItemRow>
              ))}
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                onClick={() =>
                  set("story", { paragraphs: [...about.story.paragraphs, { vi: "", en: "" }] })
                }
              >
                <Plus className="h-4 w-4" />
                {t("settings.item.add")}
              </Button>
              <ImagePicker
                label={tr({ vi: "Ảnh minh họa", en: "Story image" })}
                library={aboutLibrary}
                value={about.story.image}
                onChange={(image) => set("story", { image })}
              />
            </ContentBlock>

            <ContentBlock
              {...widgetProps("timeline")}
              title={tr({ vi: "Cột mốc", en: "Milestones" })}
              enabled={about.timeline.enabled}
              onToggle={(enabled) => set("timeline", { enabled })}
            >
              <CopyField
                label={t("settings.field.title")}
                value={about.timeline.title}
                onChange={(title) => set("timeline", { title })}
              />
              {about.timeline.items.map((item, index) => (
                <ItemRow
                  key={item.id}
                  index={index}
                  total={about.timeline.items.length}
                  onMove={(dir) =>
                    set("timeline", { items: move(about.timeline.items, index, dir) })
                  }
                  onRemove={() =>
                    set("timeline", {
                      items: about.timeline.items.filter((it) => it.id !== item.id),
                    })
                  }
                >
                  <div>
                    <Label className="text-sm font-medium">{tr({ vi: "Năm", en: "Year" })}</Label>
                    <Input
                      value={item.year}
                      className="mt-2 w-32"
                      onChange={(e) =>
                        set("timeline", {
                          items: about.timeline.items.map((it) =>
                            it.id === item.id ? { ...it, year: e.target.value } : it,
                          ),
                        })
                      }
                    />
                  </div>
                  <CopyField
                    label={t("settings.field.title")}
                    value={item.title}
                    onChange={(title) =>
                      set("timeline", {
                        items: about.timeline.items.map((it) =>
                          it.id === item.id ? { ...it, title } : it,
                        ),
                      })
                    }
                  />
                  <CopyField
                    label={t("settings.field.body")}
                    value={item.body}
                    multiline
                    onChange={(body) =>
                      set("timeline", {
                        items: about.timeline.items.map((it) =>
                          it.id === item.id ? { ...it, body } : it,
                        ),
                      })
                    }
                  />
                </ItemRow>
              ))}
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                onClick={() =>
                  set("timeline", {
                    items: [
                      ...about.timeline.items,
                      {
                        id: uid("milestone"),
                        year: String(new Date().getFullYear()),
                        title: { vi: "Cột mốc mới", en: "New milestone" },
                        body: { vi: "", en: "" },
                      },
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                {t("settings.item.add")}
              </Button>
            </ContentBlock>

            <ContentBlock
              {...widgetProps("values")}
              title={tr({ vi: "Giá trị cốt lõi", en: "Core values" })}
              enabled={about.values.enabled}
              onToggle={(enabled) => set("values", { enabled })}
            >
              <CopyField
                label={t("settings.field.title")}
                value={about.values.title}
                onChange={(title) => set("values", { title })}
              />
              <CopyField
                label={t("settings.field.description")}
                value={about.values.description}
                multiline
                onChange={(description) => set("values", { description })}
              />
              {about.values.items.map((item, index) => (
                <ItemRow
                  key={item.id}
                  index={index}
                  total={about.values.items.length}
                  onMove={(dir) => set("values", { items: move(about.values.items, index, dir) })}
                  onRemove={() =>
                    set("values", { items: about.values.items.filter((it) => it.id !== item.id) })
                  }
                >
                  <IconSelect
                    value={item.icon}
                    onChange={(icon) =>
                      set("values", {
                        items: about.values.items.map((it) =>
                          it.id === item.id ? { ...it, icon } : it,
                        ),
                      })
                    }
                  />
                  <CopyField
                    label={t("settings.field.title")}
                    value={item.title}
                    onChange={(title) =>
                      set("values", {
                        items: about.values.items.map((it) =>
                          it.id === item.id ? { ...it, title } : it,
                        ),
                      })
                    }
                  />
                  <CopyField
                    label={t("settings.field.body")}
                    value={item.body}
                    multiline
                    onChange={(body) =>
                      set("values", {
                        items: about.values.items.map((it) =>
                          it.id === item.id ? { ...it, body } : it,
                        ),
                      })
                    }
                  />
                </ItemRow>
              ))}
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                onClick={() =>
                  set("values", {
                    items: [
                      ...about.values.items,
                      {
                        id: uid("value"),
                        icon: "sparkles",
                        title: { vi: "Giá trị mới", en: "New value" },
                        body: { vi: "", en: "" },
                      },
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                {t("settings.item.add")}
              </Button>
            </ContentBlock>

            <ContentBlock
              {...widgetProps("leaders")}
              title={tr({ vi: "Đội ngũ dẫn dắt", en: "Leadership" })}
              enabled={about.leaders.enabled}
              onToggle={(enabled) => set("leaders", { enabled })}
            >
              <CopyField
                label={t("settings.field.title")}
                value={about.leaders.title}
                onChange={(title) => set("leaders", { title })}
              />
              {about.leaders.items.map((leader, index) => (
                <ItemRow
                  key={leader.id}
                  index={index}
                  total={about.leaders.items.length}
                  onMove={(dir) => set("leaders", { items: move(about.leaders.items, index, dir) })}
                  onRemove={() =>
                    set("leaders", {
                      items: about.leaders.items.filter((it) => it.id !== leader.id),
                    })
                  }
                >
                  <div>
                    <Label className="text-sm font-medium">
                      {tr({ vi: "Họ tên", en: "Full name" })}
                    </Label>
                    <Input
                      value={leader.name}
                      className="mt-2"
                      onChange={(e) =>
                        set("leaders", {
                          items: about.leaders.items.map((it) =>
                            it.id === leader.id ? { ...it, name: e.target.value } : it,
                          ),
                        })
                      }
                    />
                  </div>
                  <CopyField
                    label={tr({ vi: "Chức danh", en: "Role" })}
                    value={leader.role}
                    onChange={(role) =>
                      set("leaders", {
                        items: about.leaders.items.map((it) =>
                          it.id === leader.id ? { ...it, role } : it,
                        ),
                      })
                    }
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    {leader.photo ? (
                      <img
                        src={leader.photo}
                        alt={leader.name}
                        className="h-16 w-16 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <span className="grid h-16 w-16 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                        {tr({ vi: "Chưa có", en: "None" })}
                      </span>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                      <Upload className="h-4 w-4" />
                      {tr({ vi: "Tải ảnh (≤1MB)", en: "Upload photo (≤1MB)" })}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onLeaderPhoto(leader.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {leader.photo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          set("leaders", {
                            items: about.leaders.items.map((it) =>
                              it.id === leader.id ? { ...it, photo: "" } : it,
                            ),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        {tr({ vi: "Xóa ảnh", en: "Remove photo" })}
                      </Button>
                    )}
                  </div>
                </ItemRow>
              ))}
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                onClick={() =>
                  set("leaders", {
                    items: [
                      ...about.leaders.items,
                      {
                        id: uid("leader"),
                        name: tr({ vi: "Thành viên mới", en: "New member" }),
                        role: { vi: "", en: "" },
                        photo: "",
                      },
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                {t("settings.item.add")}
              </Button>
            </ContentBlock>

            <ContentBlock
              {...widgetProps("gallery")}
              title={tr({ vi: "Thư viện ảnh", en: "Photo gallery" })}
              enabled={about.gallery.enabled}
              onToggle={(enabled) => set("gallery", { enabled })}
            >
              <CopyField
                label={t("settings.field.title")}
                value={about.gallery.title}
                onChange={(title) => set("gallery", { title })}
              />
              {about.gallery.items.map((photo, index) => (
                <ItemRow
                  key={photo.id}
                  index={index}
                  total={about.gallery.items.length}
                  onMove={(dir) => set("gallery", { items: move(about.gallery.items, index, dir) })}
                  onRemove={() =>
                    set("gallery", {
                      items: about.gallery.items.filter((it) => it.id !== photo.id),
                    })
                  }
                >
                  <ImagePicker
                    label={tr({ vi: "Ảnh", en: "Photo" })}
                    library={aboutLibrary}
                    value={photo.url}
                    onChange={(url) =>
                      set("gallery", {
                        items: about.gallery.items.map((it) =>
                          it.id === photo.id ? { ...it, url } : it,
                        ),
                      })
                    }
                  />
                  <CopyField
                    label={tr({ vi: "Chú thích", en: "Caption" })}
                    value={photo.caption}
                    onChange={(caption) =>
                      set("gallery", {
                        items: about.gallery.items.map((it) =>
                          it.id === photo.id ? { ...it, caption } : it,
                        ),
                      })
                    }
                  />
                </ItemRow>
              ))}
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                onClick={() =>
                  set("gallery", {
                    items: [
                      ...about.gallery.items,
                      {
                        id: uid("photo"),
                        url: aboutLibrary[0]?.url ?? "",
                        caption: { vi: "", en: "" },
                      },
                    ],
                  })
                }
              >
                <Plus className="h-4 w-4" />
                {t("settings.item.add")}
              </Button>
            </ContentBlock>

            <ContentBlock
              {...widgetProps("contact")}
              title={tr({ vi: "Khối liên hệ", en: "Contact block" })}
              enabled={about.contact.enabled}
              onToggle={(enabled) => set("contact", { enabled })}
            >
              <p className="text-sm text-muted-foreground">
                {tr({
                  vi: "Địa chỉ, email và điện thoại lấy từ tab Thương hiệu, chỉnh một nơi là đồng bộ mọi trang.",
                  en: "Addresses, email and phone come from the Brand tab and stay in sync everywhere.",
                })}
              </p>
            </ContentBlock>
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap justify-end gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <RotateCcw className="h-4 w-4" />
              {tr({ vi: "Khôi phục mặc định", en: "Restore defaults" })}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {tr({ vi: "Khôi phục nội dung mặc định?", en: "Restore default content?" })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {tr({
                  vi: "Toàn bộ nội dung trang Về chúng tôi sẽ trở về bản gốc. Nội dung bạn đã tùy chỉnh sẽ mất.",
                  en: "The whole About page content returns to the original version. Your customisations will be lost.",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tr({ vi: "Hủy", en: "Cancel" })}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onChange(structuredClone(defaultAbout));
                  toast.success(
                    tr({ vi: "Đã khôi phục nội dung mặc định.", en: "Default content restored." }),
                  );
                }}
              >
                {tr({ vi: "Khôi phục", en: "Restore" })}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={onSave}>
          <Save className="h-4 w-4" />
          {tr({ vi: "Lưu thay đổi", en: "Save changes" })}
        </Button>
      </div>
    </div>
  );
}

function AdminSettings() {
  const { t, tr } = useI18n();
  const { config, save, reset } = useSiteConfig();
  const [draft, setDraft] = useState<SiteConfig>(config);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const update = (patch: Partial<SiteConfig>) => setDraft((prev) => ({ ...prev, ...patch }));

  const setCompany = (patch: Partial<SiteConfig["company"]>) =>
    setDraft((prev) => ({ ...prev, company: { ...prev.company, ...patch } }));

  const setSection = <K extends keyof SiteSections>(key: K, patch: Partial<SiteSections[K]>) =>
    setDraft((prev) => ({
      ...prev,
      sections: { ...prev.sections, [key]: { ...prev.sections[key], ...patch } },
    }));

  const s = draft.sections;

  const homeOrder = s.order?.length ? s.order : defaultSections.order;

  const setHomeStyle = (key: HomeWidgetKey, patch: Partial<AboutWidgetStyle>) =>
    setDraft((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        styles: {
          ...prev.sections.styles,
          [key]: { ...prev.sections.styles[key], ...patch },
        },
      },
    }));

  const resetHomeWidget = (key: HomeWidgetKey) => {
    const base = structuredClone(defaultSections);
    setDraft((prev) => ({
      ...prev,
      copy:
        key === "hero"
          ? {
              ...prev.copy,
              brand: structuredClone(defaultSiteConfig.copy.brand),
              eyebrow: structuredClone(defaultSiteConfig.copy.eyebrow),
              title: structuredClone(defaultSiteConfig.copy.title),
              subtitle: structuredClone(defaultSiteConfig.copy.subtitle),
              ctaLabel: structuredClone(defaultSiteConfig.copy.ctaLabel),
            }
          : prev.copy,
      sections: {
        ...prev.sections,
        [key]: base[key],
        styles: { ...prev.sections.styles, [key]: base.styles[key] },
      },
    }));
    toast.success(tr({ vi: "Đã khôi phục khối này.", en: "Block restored." }));
  };

  const homeWidgetProps = (key: HomeWidgetKey) => ({
    widgetKey: key,
    widgetStyle: s.styles?.[key],
    orderIndex: homeOrder.indexOf(key),
    onWidgetStyle: (patch: Partial<AboutWidgetStyle>) => setHomeStyle(key, patch),
    onReset: () => resetHomeWidget(key),
  });

  const onHomeDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = homeOrder.indexOf(active.id as HomeWidgetKey);
    const to = homeOrder.indexOf(over.id as HomeWidgetKey);
    if (from >= 0 && to >= 0) {
      setDraft((prev) => ({
        ...prev,
        sections: { ...prev.sections, order: arrayMove(homeOrder, from, to) },
      }));
    }
  };

  const itemsEditor = (key: "culture" | "benefits") => {
    const items = s[key].items;
    const setItems = (next: HomeItemConfig[]) => setSection(key, { items: next });
    return (
      <div className="grid gap-4">
        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            index={index}
            total={items.length}
            onMove={(dir) => setItems(move(items, index, dir))}
            onRemove={() => setItems(items.filter((it) => it.id !== item.id))}
          >
            <IconSelect
              value={item.icon}
              onChange={(icon) =>
                setItems(items.map((it) => (it.id === item.id ? { ...it, icon } : it)))
              }
            />
            <CopyField
              label={t("settings.field.title")}
              value={item.title}
              onChange={(title) =>
                setItems(items.map((it) => (it.id === item.id ? { ...it, title } : it)))
              }
            />
            <CopyField
              label={t("settings.field.body")}
              value={item.body}
              multiline
              onChange={(body) =>
                setItems(items.map((it) => (it.id === item.id ? { ...it, body } : it)))
              }
            />
          </ItemRow>
        ))}
        <Button
          type="button"
          variant="outline"
          className="justify-self-start"
          onClick={() => setItems([...items, newItem()])}
        >
          <Plus className="h-4 w-4" />
          {t("settings.item.add")}
        </Button>
      </div>
    );
  };

  const saveDraft = () => {
    const ok = save(draft);
    if (ok) toast.success(t("settings.saved"));
    else toast.error(t("settings.brand.quota"));
  };

  const onLogoFile = (file: File) => {
    const allowed = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(t("settings.brand.uploadInvalid"));
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error(t("settings.brand.uploadTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (url) update({ images: { ...draft.images, logo: url } });
    };
    reader.readAsDataURL(file);
  };

  return (
    <AdminLayout
      title={t("settings.title")}
      description={t("settings.subtitle")}
      action={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.preview")}</span>
            </Link>
          </Button>
          <Button size="sm" onClick={saveDraft}>
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{t("common.save")}</span>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6">
        <Tabs defaultValue="brand">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="brand">{t("settings.tab.brand")}</TabsTrigger>
            <TabsTrigger value="layout">{t("settings.tab.layout")}</TabsTrigger>
            <TabsTrigger value="jobsPage">{t("settings.tab.jobsPage")}</TabsTrigger>
            <TabsTrigger value="palette">{t("settings.tab.palette")}</TabsTrigger>
            <TabsTrigger value="images">{t("settings.tab.images")}</TabsTrigger>
            <TabsTrigger value="content">{t("settings.tab.content")}</TabsTrigger>
            <TabsTrigger value="about">{tr({ vi: "Về chúng tôi", en: "About us" })}</TabsTrigger>
            <TabsTrigger value="modules">{tr({ vi: "Mô-đun", en: "Modules" })}</TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="mt-5">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display text-base font-semibold">
                  {t("settings.brand.title")}
                </h2>
                <div className="mt-5 grid gap-5">
                  <CopyField
                    label={t("settings.brand.name")}
                    value={draft.copy.brand}
                    onChange={(brand) => update({ copy: { ...draft.copy, brand } })}
                  />
                  <CopyField
                    label={t("settings.brand.tagline")}
                    value={draft.copy.tagline}
                    onChange={(tagline) => update({ copy: { ...draft.copy, tagline } })}
                  />

                  <div className="grid gap-3 border-t border-border pt-5">
                    <ImagePicker
                      label={t("settings.brand.logo")}
                      library={logoLibrary}
                      value={draft.images.logo}
                      onChange={(logo) => update({ images: { ...draft.images, logo } })}
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium transition-colors hover:border-primary/40">
                        <Upload className="h-4 w-4" />
                        {t("settings.brand.upload")}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onLogoFile(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => update({ images: { ...draft.images, logo: "" } })}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("settings.brand.removeLogo")}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {t("settings.brand.uploadHint")}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="brand-primary">{t("settings.palette.primary")}</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          id="brand-primary"
                          type="color"
                          value={draft.primary}
                          onChange={(e) => update({ primary: e.target.value, paletteId: "custom" })}
                          className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-border bg-card"
                        />
                        <Input
                          value={draft.primary}
                          onChange={(e) => update({ primary: e.target.value, paletteId: "custom" })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="brand-accent">{t("settings.palette.accent")}</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          id="brand-accent"
                          type="color"
                          value={draft.accent}
                          onChange={(e) => update({ accent: e.target.value, paletteId: "custom" })}
                          className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-border bg-card"
                        />
                        <Input
                          value={draft.accent}
                          onChange={(e) => update({ accent: e.target.value, paletteId: "custom" })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display text-base font-semibold">
                  {t("settings.brand.preview")}
                </h2>
                <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    {draft.images.logo ? (
                      <img
                        src={draft.images.logo}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-lg object-contain"
                      />
                    ) : (
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg font-display text-sm font-bold"
                        style={{ backgroundColor: draft.primary, color: readableOn(draft.primary) }}
                      >
                        {brandInitials(tr(draft.copy.brand))}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-semibold">
                        {tr(draft.copy.brand)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tr(draft.copy.tagline)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <span
                      className="h-8 flex-1 rounded-md"
                      style={{ backgroundColor: draft.primary }}
                    />
                    <span
                      className="h-8 flex-1 rounded-md"
                      style={{ backgroundColor: draft.accent }}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-display text-base font-semibold">{t("company.title")}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{t("company.optional")}</p>
                <div className="mt-5 grid gap-5">
                  <CopyField
                    label={t("company.intro")}
                    value={draft.company.intro}
                    onChange={(intro) => setCompany({ intro })}
                    multiline
                  />

                  <div>
                    <Label className="text-sm font-medium">{t("company.locations")}</Label>
                    <div className="mt-3 grid gap-4">
                      {draft.company.locations.map((loc, index) => (
                        <ItemRow
                          key={loc.id}
                          index={index}
                          total={draft.company.locations.length}
                          onMove={(dir) =>
                            setCompany({ locations: move(draft.company.locations, index, dir) })
                          }
                          onRemove={() =>
                            setCompany({
                              locations: draft.company.locations.filter((l) => l.id !== loc.id),
                            })
                          }
                        >
                          <CopyField
                            label={t("company.location.name")}
                            value={loc.name}
                            onChange={(name) =>
                              setCompany({
                                locations: draft.company.locations.map((l) =>
                                  l.id === loc.id ? { ...l, name } : l,
                                ),
                              })
                            }
                          />
                          <CopyField
                            label={t("company.location.address")}
                            value={loc.address}
                            onChange={(address) =>
                              setCompany({
                                locations: draft.company.locations.map((l) =>
                                  l.id === loc.id ? { ...l, address } : l,
                                ),
                              })
                            }
                            multiline
                          />
                        </ItemRow>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-fit"
                        onClick={() =>
                          setCompany({
                            locations: [
                              ...draft.company.locations,
                              {
                                id: `loc-${Date.now()}`,
                                name: { vi: "Chi nhánh mới", en: "New office" },
                                address: { vi: "", en: "" },
                              },
                            ],
                          })
                        }
                      >
                        {t("company.location.add")}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">{t("company.email")}</Label>
                      <Input
                        className="mt-2"
                        value={draft.company.email}
                        onChange={(e) => setCompany({ email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("company.phone")}</Label>
                      <Input
                        className="mt-2"
                        value={draft.company.phone}
                        onChange={(e) => setCompany({ phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("company.website")}</Label>
                      <Input
                        className="mt-2"
                        placeholder="https://"
                        value={draft.company.website}
                        onChange={(e) => setCompany({ website: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("company.legalName")}</Label>
                      <Input
                        className="mt-2"
                        value={draft.company.legalName}
                        onChange={(e) => setCompany({ legalName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{t("company.taxId")}</Label>
                      <Input
                        className="mt-2"
                        value={draft.company.taxId}
                        onChange={(e) => setCompany({ taxId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{t("company.social")}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">{t("company.social.note")}</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {(
                        ["facebook", "linkedin", "youtube", "github", "zalo", "tiktok"] as const
                      ).map((key) => (
                        <div key={key}>
                          <span className="text-xs capitalize text-muted-foreground">{key}</span>
                          <Input
                            className="mt-1"
                            placeholder="https://"
                            value={draft.company.social[key]}
                            onChange={(e) =>
                              setCompany({
                                social: { ...draft.company.social, [key]: e.target.value },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <CopyField
                    label={t("company.copyright")}
                    value={draft.company.copyright}
                    onChange={(copyright) => setCompany({ copyright })}
                  />
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="mt-5">
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold">{t("settings.layout.title")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {layoutPresets.map((preset) => {
                  const selected = draft.layout === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => update({ layout: preset.id })}
                      className={cn(
                        "rounded-lg border-2 p-3 text-left transition-colors",
                        selected
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <LayoutThumb id={preset.id} />
                      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                        <h3 className="min-w-0 truncate font-display text-sm font-semibold">
                          {tr(preset.name)}
                        </h3>
                        {selected && (
                          <span className="flex shrink-0 items-center gap-1 text-xs text-accent">
                            <Check className="h-3.5 w-3.5" /> {t("settings.layout.current")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {tr(preset.description)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="jobsPage" className="mt-5">
            <section className="space-y-5 rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold">{t("settings.tab.jobsPage")}</h2>

              <div className="space-y-2">
                <Label>{t("settings.jobs.filterLayout")}</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["sidebar", "bar"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        update({ jobsPage: { ...draft.jobsPage, filterLayout: option } })
                      }
                      className={cn(
                        "rounded-lg border-2 p-3 text-left text-sm transition-colors",
                        draft.jobsPage.filterLayout === option
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {option === "sidebar"
                        ? t("settings.jobs.layout.sidebar")
                        : t("settings.jobs.layout.bar")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("settings.jobs.filters")}</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["department", "jobs.filter.department"],
                      ["location", "jobs.filter.location"],
                      ["workType", "jobs.filter.type"],
                      ["level", "jobs.filter.level"],
                      ["salary", "jobs.filter.salary"],
                      ["experience", "jobs.filter.experience"],
                      ["status", "jobs.filter.status"],
                    ] as const
                  ).map(([key, labelKey]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-sm">{t(labelKey)}</span>
                      <Switch
                        checked={draft.jobsPage.filters[key]}
                        onCheckedChange={(checked) =>
                          update({
                            jobsPage: {
                              ...draft.jobsPage,
                              filters: { ...draft.jobsPage.filters, [key]: checked },
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("settings.jobs.card")}</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["salary", "jobs.salary"],
                      ["deadline", "jobs.deadline"],
                      ["featuredBadge", "jobs.featured"],
                    ] as const
                  ).map(([key, labelKey]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-sm">{t(labelKey)}</span>
                      <Switch
                        checked={draft.jobsPage.card[key]}
                        onCheckedChange={(checked) =>
                          update({
                            jobsPage: {
                              ...draft.jobsPage,
                              card: { ...draft.jobsPage.card, [key]: checked },
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jobs-page-size">{t("settings.jobs.pageSize")}</Label>
                  <Input
                    id="jobs-page-size"
                    type="number"
                    min={2}
                    max={30}
                    value={draft.jobsPage.pageSize}
                    onChange={(e) =>
                      update({
                        jobsPage: {
                          ...draft.jobsPage,
                          pageSize: Math.max(2, Math.min(30, Number(e.target.value) || 8)),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("settings.field.title")} (VI)</Label>
                  <Input
                    value={draft.jobsPage.title.vi}
                    onChange={(e) =>
                      update({
                        jobsPage: {
                          ...draft.jobsPage,
                          title: { ...draft.jobsPage.title, vi: e.target.value },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.field.title")} (EN)</Label>
                  <Input
                    value={draft.jobsPage.title.en}
                    onChange={(e) =>
                      update({
                        jobsPage: {
                          ...draft.jobsPage,
                          title: { ...draft.jobsPage.title, en: e.target.value },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.field.description")} (VI)</Label>
                  <Textarea
                    rows={3}
                    value={draft.jobsPage.subtitle.vi}
                    onChange={(e) =>
                      update({
                        jobsPage: {
                          ...draft.jobsPage,
                          subtitle: { ...draft.jobsPage.subtitle, vi: e.target.value },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.field.description")} (EN)</Label>
                  <Textarea
                    rows={3}
                    value={draft.jobsPage.subtitle.en}
                    onChange={(e) =>
                      update({
                        jobsPage: {
                          ...draft.jobsPage,
                          subtitle: { ...draft.jobsPage.subtitle, en: e.target.value },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="palette" className="mt-5">
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold">
                {t("settings.palette.title")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {palettePresets.map((palette) => {
                  const selected = draft.paletteId === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() =>
                        update({
                          paletteId: palette.id,
                          primary: palette.primary,
                          accent: palette.accent,
                        })
                      }
                      className={cn(
                        "rounded-lg border-2 p-3 text-left transition-colors",
                        selected ? "border-accent" : "border-border hover:border-primary/40",
                      )}
                    >
                      <div className="flex gap-1.5">
                        {palette.swatches.map((color) => (
                          <span
                            key={color}
                            className="h-8 flex-1 rounded-md"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="mt-2.5 truncate text-sm font-medium">{tr(palette.name)}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="primary-color">{t("settings.palette.primary")}</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="primary-color"
                      type="color"
                      value={draft.primary}
                      onChange={(e) => update({ primary: e.target.value, paletteId: "custom" })}
                      className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-border bg-card"
                    />
                    <Input
                      value={draft.primary}
                      onChange={(e) => update({ primary: e.target.value, paletteId: "custom" })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent-color">{t("settings.palette.accent")}</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="accent-color"
                      type="color"
                      value={draft.accent}
                      onChange={(e) => update({ accent: e.target.value, paletteId: "custom" })}
                      className="h-10 w-14 shrink-0 cursor-pointer rounded-md border border-border bg-card"
                    />
                    <Input
                      value={draft.accent}
                      onChange={(e) => update({ accent: e.target.value, paletteId: "custom" })}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-5">
                <Label>{tr({ vi: "Cường độ màu nền", en: "Background intensity" })}</Label>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      { id: "white", vi: "Trắng tinh", en: "Pure white" },
                      { id: "tinted", vi: "Pha nhẹ màu thương hiệu", en: "Subtle brand tint" },
                      { id: "soft", vi: "Đậm hơn", en: "Stronger tint" },
                    ] as { id: SurfaceTone; vi: string; en: string }[]
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => update({ surfaceTone: option.id })}
                      className={cn(
                        "rounded-lg border-2 p-3 text-left text-sm font-medium transition-colors",
                        draft.surfaceTone === option.id
                          ? "border-accent"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {tr({ vi: option.vi, en: option.en })}
                    </button>
                  ))}
                </div>
              </div>

              <ContrastNotice primary={draft.primary} accent={draft.accent} tr={tr} />

              <div className="mt-5 border-t border-border pt-5">
                <Label>{tr({ vi: "Xem trước", en: "Preview" })}</Label>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  <BrandPreviewHome primary={draft.primary} accent={draft.accent} tr={tr} />
                  <BrandPreviewJobs primary={draft.primary} accent={draft.accent} tr={tr} />
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="images" className="mt-5">
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold">{t("settings.images.title")}</h2>
              <div className="mt-4 grid gap-6 lg:grid-cols-3">
                <ImagePicker
                  label={t("settings.images.hero")}
                  library={heroLibrary}
                  value={draft.images.hero}
                  onChange={(hero) => update({ images: { ...draft.images, hero } })}
                />
                <ImagePicker
                  label={t("settings.images.culture")}
                  library={cultureLibrary}
                  value={draft.images.culture}
                  onChange={(culture) => update({ images: { ...draft.images, culture } })}
                />
                <ImagePicker
                  label={t("settings.images.logo")}
                  library={logoLibrary}
                  value={draft.images.logo}
                  onChange={(logo) => update({ images: { ...draft.images, logo } })}
                />
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-sm font-semibold">
                    {tr({ vi: "Băng ảnh trang chủ (tối đa 5)", en: "Home hero slideshow (max 5)" })}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {draft.images.heroImages.length}/5
                    </span>
                  </h3>
                  <Button size="sm" onClick={saveDraft}>
                    {tr({ vi: "Lưu thay đổi", en: "Save changes" })}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tr({
                    vi: "Ảnh tự chuyển sau mỗi 3 giây. Chỉ 1 ảnh thì hiển thị tĩnh.",
                    en: "Images auto-rotate every 3 seconds. A single image stays static.",
                  })}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {heroLibrary.map((item) => {
                    const list = draft.images.heroImages;
                    const active = list.includes(item.url);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (!active && list.length >= 5) {
                            toast.error(
                              tr({
                                vi: "Chỉ được chọn tối đa 5 ảnh cho băng ảnh trang chủ.",
                                en: "You can select at most 5 hero images.",
                              }),
                            );
                            return;
                          }
                          const next = active
                            ? list.filter((url) => url !== item.url)
                            : [...list, item.url];
                          update({
                            images: {
                              ...draft.images,
                              heroImages: next.length ? next : [item.url],
                              hero: (next[0] ?? item.url) as string,
                            },
                          });
                        }}
                        className={cn(
                          "overflow-hidden rounded-lg border-2 text-left",
                          active ? "border-accent" : "border-border",
                        )}
                      >
                        <img
                          src={item.url}
                          alt={tr(item.label)}
                          className="h-24 w-full object-cover"
                        />
                        <span className="block px-3 py-2 text-xs">
                          {tr(item.label)}
                          {active ? ` · ${String(list.indexOf(item.url) + 1)}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="about" className="mt-5">
            <AboutPanel
              about={draft.about}
              onChange={(about) => update({ about })}
              onSave={saveDraft}
            />
          </TabsContent>

          <TabsContent value="modules" className="mt-5">
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold">
                {tr({ vi: "Mô-đun theo dự án", en: "Project modules" })}
              </h2>
              <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{tr({ vi: "Tin tức", en: "News" })}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tr({
                      vi: "Tắt sẽ ẩn menu Tin tức và chặn truy cập trực tiếp đường dẫn.",
                      en: "Turning this off hides the News menu and blocks direct URL access.",
                    })}
                  </p>
                </div>
                <Switch
                  checked={draft.modules.news}
                  onCheckedChange={(news) => update({ modules: { ...draft.modules, news } })}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 rounded-md border border-border p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {tr({ vi: "Gửi hồ sơ tự do", en: "Open application" })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tr({
                      vi: "Tắt sẽ ẩn nút gửi hồ sơ tự do trên trang chủ, trang việc làm và chặn trang nộp hồ sơ.",
                      en: "Turning this off hides open-application buttons on the home and job pages and blocks the application page.",
                    })}
                  </p>
                </div>
                <Switch
                  checked={draft.modules.openApplication}
                  onCheckedChange={(openApplication) =>
                    update({ modules: { ...draft.modules, openApplication } })
                  }
                />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="content" className="mt-5">
            <p className="mb-4 text-xs text-muted-foreground">
              {tr({
                vi: "Kéo tay nắm để sắp xếp thứ tự các khối trên trang chủ, bật/tắt và chỉnh bố cục từng khối.",
                en: "Drag the handle to reorder home page blocks, toggle them and tune each layout.",
              })}
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4" />
                    {tr({ vi: "Khôi phục bố cục mặc định", en: "Restore default layout" })}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {tr({ vi: "Khôi phục bố cục mặc định?", en: "Restore default layout?" })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {tr({
                        vi: "Thứ tự và kiểu hiển thị của tất cả khối trang chủ sẽ trở về bản gốc. Chữ trong từng khối được giữ nguyên.",
                        en: "Order and display style of every home block return to the original version. Text inside each block stays.",
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tr({ vi: "Hủy", en: "Cancel" })}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            order: [...defaultSections.order],
                            styles: structuredClone(defaultSections.styles),
                          },
                        }))
                      }
                    >
                      {tr({ vi: "Khôi phục", en: "Restore" })}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button size="sm" onClick={saveDraft}>
                <Save className="h-4 w-4" />
                {t("common.save")}
              </Button>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={onHomeDragEnd}>
              <SortableContext items={homeOrder} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-6">
                  <ContentBlock
                    title={t("settings.block.hero")}
                    enabled={s.hero?.enabled !== false}
                    onToggle={(enabled) => setSection("hero", { enabled })}
                    {...homeWidgetProps("hero")}
                  >
                    <CopyField
                      label={t("settings.copy.brand")}
                      value={draft.copy.brand}
                      onChange={(brand) => update({ copy: { ...draft.copy, brand } })}
                    />
                    <CopyField
                      label={t("settings.copy.eyebrow")}
                      value={draft.copy.eyebrow}
                      onChange={(eyebrow) => update({ copy: { ...draft.copy, eyebrow } })}
                    />
                    <CopyField
                      label={t("settings.copy.headline")}
                      value={draft.copy.title}
                      onChange={(title) => update({ copy: { ...draft.copy, title } })}
                    />
                    <CopyField
                      label={t("settings.copy.subtitle")}
                      value={draft.copy.subtitle}
                      onChange={(subtitle) => update({ copy: { ...draft.copy, subtitle } })}
                      multiline
                    />
                    <CopyField
                      label={t("settings.copy.cta")}
                      value={draft.copy.ctaLabel}
                      onChange={(ctaLabel) => update({ copy: { ...draft.copy, ctaLabel } })}
                    />
                  </ContentBlock>

                  <ContentBlock
                    title={t("settings.block.stats")}
                    enabled={s.stats.enabled}
                    onToggle={(enabled) => setSection("stats", { enabled })}
                    {...homeWidgetProps("stats")}
                  >
                    {s.stats.items.map((stat, index) => (
                      <ItemRow
                        key={stat.id}
                        index={index}
                        total={s.stats.items.length}
                        onMove={(dir) =>
                          setSection("stats", { items: move(s.stats.items, index, dir) })
                        }
                        onRemove={() =>
                          setSection("stats", {
                            items: s.stats.items.filter((it) => it.id !== stat.id),
                          })
                        }
                      >
                        <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-end">
                          <div>
                            <Label className="text-sm font-medium">
                              {t("settings.field.value")}
                            </Label>
                            <Input
                              value={stat.value}
                              disabled={stat.auto}
                              className="mt-2"
                              onChange={(e) =>
                                setSection("stats", {
                                  items: s.stats.items.map((it) =>
                                    it.id === stat.id ? { ...it, value: e.target.value } : it,
                                  ),
                                })
                              }
                            />
                          </div>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Switch
                              checked={!!stat.auto}
                              onCheckedChange={(auto) =>
                                setSection("stats", {
                                  items: s.stats.items.map((it) =>
                                    it.id === stat.id ? { ...it, auto } : it,
                                  ),
                                })
                              }
                            />
                            {t("settings.field.autoCount")}
                          </label>
                        </div>
                        <CopyField
                          label={t("settings.field.label")}
                          value={stat.label}
                          onChange={(label) =>
                            setSection("stats", {
                              items: s.stats.items.map((it) =>
                                it.id === stat.id ? { ...it, label } : it,
                              ),
                            })
                          }
                        />
                      </ItemRow>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="justify-self-start"
                      onClick={() =>
                        setSection("stats", {
                          items: [
                            ...s.stats.items,
                            {
                              id: `stat-${Date.now()}`,
                              value: "0",
                              label: { vi: "Mục mới", en: "New item" },
                            },
                          ],
                        })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      {t("settings.item.add")}
                    </Button>
                  </ContentBlock>

                  <ContentBlock
                    title={t("settings.block.culture")}
                    enabled={s.culture.enabled}
                    onToggle={(enabled) => setSection("culture", { enabled })}
                    {...homeWidgetProps("culture")}
                  >
                    <CopyField
                      label={t("settings.field.eyebrow")}
                      value={s.culture.eyebrow}
                      onChange={(eyebrow) => setSection("culture", { eyebrow })}
                    />
                    <CopyField
                      label={t("settings.field.title")}
                      value={s.culture.title}
                      onChange={(title) => setSection("culture", { title })}
                    />
                    <CopyField
                      label={t("settings.field.description")}
                      value={s.culture.description}
                      multiline
                      onChange={(description) => setSection("culture", { description })}
                    />
                    {itemsEditor("culture")}
                  </ContentBlock>

                  <ContentBlock
                    title={t("settings.block.benefits")}
                    enabled={s.benefits.enabled}
                    onToggle={(enabled) => setSection("benefits", { enabled })}
                    {...homeWidgetProps("benefits")}
                  >
                    <CopyField
                      label={t("settings.field.eyebrow")}
                      value={s.benefits.eyebrow}
                      onChange={(eyebrow) => setSection("benefits", { eyebrow })}
                    />
                    <CopyField
                      label={t("settings.field.title")}
                      value={s.benefits.title}
                      onChange={(title) => setSection("benefits", { title })}
                    />
                    <CopyField
                      label={t("settings.field.description")}
                      value={s.benefits.description}
                      multiline
                      onChange={(description) => setSection("benefits", { description })}
                    />
                    {itemsEditor("benefits")}
                  </ContentBlock>

                  <ContentBlock
                    title={t("settings.block.jobs")}
                    enabled={s.jobs.enabled}
                    onToggle={(enabled) => setSection("jobs", { enabled })}
                    {...homeWidgetProps("jobs")}
                  >
                    <CopyField
                      label={t("settings.field.eyebrow")}
                      value={s.jobs.eyebrow}
                      onChange={(eyebrow) => setSection("jobs", { eyebrow })}
                    />
                    <CopyField
                      label={t("settings.field.title")}
                      value={s.jobs.title}
                      onChange={(title) => setSection("jobs", { title })}
                    />
                    <CopyField
                      label={t("settings.field.allLabel")}
                      value={s.jobs.allLabel}
                      onChange={(allLabel) => setSection("jobs", { allLabel })}
                    />
                    <div>
                      <Label htmlFor="jobs-count" className="text-sm font-medium">
                        {t("settings.field.count")}
                      </Label>
                      <Input
                        id="jobs-count"
                        type="number"
                        min={1}
                        max={6}
                        value={s.jobs.count}
                        onChange={(e) => setSection("jobs", { count: Number(e.target.value) })}
                        className="mt-2 w-28"
                      />
                    </div>
                  </ContentBlock>

                  <ContentBlock
                    title={t("settings.block.cta")}
                    enabled={s.cta.enabled}
                    onToggle={(enabled) => setSection("cta", { enabled })}
                    {...homeWidgetProps("cta")}
                  >
                    <CopyField
                      label={t("settings.field.title")}
                      value={s.cta.title}
                      onChange={(title) => setSection("cta", { title })}
                    />
                    <CopyField
                      label={t("settings.field.body")}
                      value={s.cta.body}
                      multiline
                      onChange={(body) => setSection("cta", { body })}
                    />
                    <CopyField
                      label={t("settings.field.buttonLabel")}
                      value={s.cta.buttonLabel}
                      onChange={(buttonLabel) => setSection("cta", { buttonLabel })}
                    />
                  </ContentBlock>
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-5">
          <p className="text-xs text-muted-foreground">{t("settings.storageNote")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                reset();
                setDraft(defaultSiteConfig);
                toast.success(t("settings.resetDone"));
              }}
            >
              <RotateCcw className="h-4 w-4" />
              {t("settings.reset")}
            </Button>
            <Button onClick={saveDraft}>
              <Save className="h-4 w-4" />
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
