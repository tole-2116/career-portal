import type { ReactNode } from "react";

/** Languages the system can display / capture content in (fixed: Vietnamese + English). */
export const availableLanguages = [
  { code: "vi", label: "Tiếng Việt", short: "VI" },
  { code: "en", label: "English", short: "EN" },
] as const;

export type LanguageCode = (typeof availableLanguages)[number]["code"];

export const languageLabel = (code: string) =>
  availableLanguages.find((item) => item.code === code)?.label ?? code.toUpperCase();

export const languageShort = (code: string) =>
  availableLanguages.find((item) => item.code === code)?.short ?? code.toUpperCase();

export type LanguageSettings = {
  /** Ordered list of enabled language codes. */
  enabled: string[];
  /** Fallback language used when a value is missing. */
  fallback: string;
};

export const defaultLanguageSettings: LanguageSettings = {
  enabled: ["vi", "en"],
  fallback: "vi",
};

/** Kept as a pass-through wrapper so the root layout stays unchanged. */
export function LanguageConfigProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useLanguageConfig(): LanguageSettings {
  return defaultLanguageSettings;
}
