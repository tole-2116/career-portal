import { useState, type ChangeEvent } from "react";

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

/** Single-line (or multiline) value captured per language. */
export function LocalizedField({
  label,
  value,
  onChange,
  required,
  multiline,
  placeholder,
  showAllLanguages = false,
}: {
  label: string;
  value: Localized;
  onChange: (next: Localized) => void;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
  showAllLanguages?: boolean;
}) {
  const { languages, active, setActive } = useTabs();

  const renderControl = (language: string) => {
    const controlProps = {
      value: value[language] ?? "",
      placeholder: placeholder ?? languageLabel(language),
      "aria-label": `${label} — ${languageLabel(language)}`,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...value, [language]: event.target.value }),
    };

    return multiline ? (
      <Textarea key={language} rows={3} {...controlProps} />
    ) : (
      <Input
        key={language}
        {...controlProps}
        required={required && language === "vi"}
      />
    );
  };

  return (
    <div className="space-y-2">
      {showAllLanguages ? (
        <>
          <Label>{label}</Label>
          <div className="space-y-3">{languages.map(renderControl)}</div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>{label}</Label>
            <LanguageTabs active={active} onChange={setActive} languages={languages} />
          </div>
          {renderControl(active)}
        </>
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
