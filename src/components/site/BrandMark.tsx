import { useI18n } from "@/lib/i18n";
import { useSiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function brandInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function BrandMark({
  size = 36,
  className,
  tone = "default",
}: {
  size?: number;
  className?: string;
  tone?: "default" | "sidebar";
}) {
  const { tr } = useI18n();
  const { config } = useSiteConfig();
  const name = tr(config.copy.brand);
  const logo = config.images.logo?.trim();

  if (!logo) {
    return (
      <span
        style={{ width: size, height: size }}
        className={cn(
          "grid shrink-0 place-items-center rounded-lg font-display text-sm font-bold",
          tone === "sidebar"
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "bg-primary text-primary-foreground",
          className,
        )}
      >
        {brandInitials(name)}
      </span>
    );
  }

  return (
    <img
      src={logo}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      decoding="async"
      className={cn("block shrink-0 rounded-lg bg-transparent object-contain", className)}
    />
  );
}
