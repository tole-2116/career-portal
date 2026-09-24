import { useEffect } from "react";

import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PublicLanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const isEnglish = lang === "en";

  useEffect(() => {
    if (lang !== "vi" && lang !== "en") setLang("vi");
  }, [lang, setLang]);

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1.5",
        className,
      )}
      role="group"
      aria-label="Ngôn ngữ / Language"
    >
      <span
        className={cn(
          "text-xs font-semibold transition-colors",
          !isEnglish ? "text-foreground" : "text-muted-foreground",
        )}
      >
        VI
      </span>
      <Switch
        checked={isEnglish}
        onCheckedChange={(checked) => setLang(checked ? "en" : "vi")}
        aria-label={isEnglish ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
        className="h-5 w-9"
      />
      <span
        className={cn(
          "text-xs font-semibold transition-colors",
          isEnglish ? "text-foreground" : "text-muted-foreground",
        )}
      >
        EN
      </span>
    </div>
  );
}