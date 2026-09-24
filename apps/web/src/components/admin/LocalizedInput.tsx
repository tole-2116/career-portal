import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Localized } from "@/lib/i18n";
import { languageLabel, useLanguageConfig } from "@/lib/language-config";
import { cn } from "@/lib/utils";

/** Tab strip listing every enabled language. */
export function LanguageTabs({
  active,
  onChange,
  languages,
}: {
  active: string;
  onChange: (code: string) => void;
  languages: string[];
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-md bg-muted p-1">
      {languages.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={active === code}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            active === code
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {languageLabel(code)}
        </button>
      ))}
    </div>
  );
}

function useTabs() {
  const { enabled } = useLanguageConfig();
  const [active, setActive] = useState(enabled[0] ?? "vi");
  const current = enabled.includes(active) ? active : (enabled[0] ?? "vi");
  return { languages: enabled, active: current, setActive };
}

/** Single-line (or multiline) value captured per language via tabs. */
export function LocalizedField({
  label,
  value,
  onChange,
  required,
  multiline,
  placeholder,
}: {
  label: string;
  value: Localized;
  onChange: (next: Localized) => void;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  const { languages, active, setActive } = useTabs();
  const text = value[active] ?? "";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        <LanguageTabs active={active} onChange={setActive} languages={languages} />
      </div>
      {multiline ? (
        <Textarea
          rows={3}
          value={text}
          placeholder={placeholder ?? languageLabel(active)}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        />
      ) : (
        <Input
          value={text}
          required={required && active === "vi"}
          placeholder={placeholder ?? languageLabel(active)}
          onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        />
      )}
    </div>
  );
}

/** List of paragraphs — one line per item — captured per language via tabs. */
export function LocalizedListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Localized[];
  onChange: (next: Localized[]) => void;
}) {
  const { languages, active, setActive } = useTabs();
  const text = value.map((item) => item[active] ?? "").join("\n");

  const update = (raw: string) => {
    const lines = raw.split("\n");
    const next = lines.map((line, index) => {
      const existing = value[index] ?? { vi: "", en: "" };
      return { ...existing, [active]: line } as Localized;
    });
    onChange(next.filter((item, index) => index < lines.length));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        <LanguageTabs active={active} onChange={setActive} languages={languages} />
      </div>
      <Textarea rows={4} value={text} onChange={(e) => update(e.target.value)} />
    </div>
  );
}
