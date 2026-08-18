"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value: initialValue,
  onChange,
  placeholder,
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const t = useTranslations("dataTable");
  const [local, setLocal] = useState(initialValue ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function handleChange(val: string) {
    setLocal(val);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(val), debounceMs);
  }

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? t("searchPlaceholder")}
        aria-label={t("searchLabel")}
        className="h-9 w-full rounded-lg border border-border bg-surface-container-low ps-9 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
    </div>
  );
}