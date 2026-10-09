import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  buildHomeSearchSuggestions,
  type HomeSearchSuggestion,
} from "@/lib/home-search-suggestions";
import { useI18n } from "@/lib/i18n";
import { useTaxonomies } from "@/lib/taxonomy-store";
import { cn } from "@/lib/utils";
import { fetchPublicJobs } from "@/services/jobs.api";

export type HomeSearchSuggestionsProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  tone?: "light" | "dark";
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;
const SEARCH_LIMIT = 8;

export function HomeSearchSuggestions({
  value,
  onChange,
  className,
  tone = "light",
}: HomeSearchSuggestionsProps) {
  const { t, tr } = useI18n();
  const { taxonomies } = useTaxonomies();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<HomeSearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sequenceRef = useRef(0);
  const taxonomiesRef = useRef(taxonomies);

  useEffect(() => {
    taxonomiesRef.current = taxonomies;
  }, [taxonomies]);

  // Chỉ gọi API sau khi gõ đủ ký tự và dừng gõ; hủy request cũ khi query đổi.
  useEffect(() => {
    const query = value.trim();
    sequenceRef.current += 1;
    const currentSequence = sequenceRef.current;

    abortRef.current?.abort();
    abortRef.current = null;

    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsSearching(false);
      setActiveIndex(-1);
      setOpen(false);
      return;
    }

    setIsSearching(true);
    const timer = window.setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      fetchPublicJobs(
        { search: query, limit: SEARCH_LIMIT },
        { signal: controller.signal },
      )
        .then((result) => {
          if (controller.signal.aborted || sequenceRef.current !== currentSequence) {
            return;
          }
          setSuggestions(buildHomeSearchSuggestions(result.jobs, taxonomiesRef.current));
          setActiveIndex(-1);
          setOpen(true);
          setIsSearching(false);
        })
        .catch((error: unknown) => {
          if (
            controller.signal.aborted ||
            sequenceRef.current !== currentSequence ||
            (error instanceof DOMException && error.name === "AbortError")
          ) {
            return;
          }
          setSuggestions([]);
          setActiveIndex(-1);
          setIsSearching(false);
          setOpen(true);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value]);

  // Hủy request đang bay khi component unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Cuộn hàng đang chọn vào vùng nhìn khi dùng bàn phím.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const selectSuggestion = (suggestion: HomeSearchSuggestion) => {
    setOpen(false);
    setActiveIndex(-1);
    const label = tr(suggestion.label);

    if (suggestion.kind === "department") {
      navigate({ to: "/jobs", search: { departmentId: suggestion.value } });
    } else if (suggestion.kind === "location") {
      navigate({ to: "/jobs", search: { locationIds: suggestion.value } });
    } else {
      navigate({ to: "/jobs", search: { q: label } });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        current < suggestions.length - 1 ? current + 1 : current,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current > 0 ? current - 1 : 0));
      return;
    }

    if (event.key !== "Enter") return;

    if (open && suggestions.length > 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex >= 0 ? activeIndex : 0]);
      return;
    }

    if (!open && suggestions.length > 0) {
      // Dropdown đang đóng: Enter mở gợi ý trước, chưa chọn ngay.
      event.preventDefault();
      setOpen(true);
    }
  };

  const groupHeading = (kind: HomeSearchSuggestion["kind"]) => {
    if (kind === "title") return t("home.search.suggestions.titles");
    if (kind === "keyword") return t("home.search.suggestions.keywords");
    if (kind === "department") return t("home.search.suggestions.departments");
    return t("home.search.suggestions.locations");
  };

  const groups = useMemo(() => {
    const grouped = new Map<HomeSearchSuggestion["kind"], HomeSearchSuggestion[]>();
    for (const suggestion of suggestions) {
      const bucket = grouped.get(suggestion.kind);
      if (bucket) bucket.push(suggestion);
      else grouped.set(suggestion.kind, [suggestion]);
    }
    return grouped;
  }, [suggestions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("w-full", className)}>
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("home.search.keyword")}
            aria-label={t("home.search.keyword")}
            autoComplete="off"
            className={cn(
              "border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
              tone === "dark" &&
                "text-primary-foreground placeholder:text-primary-foreground/60",
            )}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList className="max-h-72">
            {isSearching ? (
              <CommandEmpty>{t("home.search.suggestions.loading")}</CommandEmpty>
            ) : suggestions.length === 0 ? (
              <CommandEmpty>{t("home.search.suggestions.empty")}</CommandEmpty>
            ) : (
              Array.from(groups.entries()).map(([kind, items]) => (
                <CommandGroup key={kind} heading={groupHeading(kind)}>
                  {items.map((suggestion) => {
                    const suggestionIndex = suggestions.indexOf(suggestion);
                    const isActive = suggestionIndex === activeIndex;
                    return (
                      <CommandItem
                        key={suggestion.id}
                        ref={isActive ? activeRef : undefined}
                        value={`${suggestion.id}-${suggestion.label.en}-${suggestion.label.vi}`}
                        data-active={isActive}
                        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                        onSelect={() => selectSuggestion(suggestion)}
                      >
                        {tr(suggestion.label)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
