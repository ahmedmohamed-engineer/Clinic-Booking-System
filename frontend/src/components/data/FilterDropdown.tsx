"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function FilterDropdown({
  options,
  value,
  onChange,
  label,
  placeholder,
  className,
}: FilterDropdownProps) {
  const t = useTranslations("dataTable");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = "filter-listbox";
  const labelId = "filter-label";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const selected = options.find((o) => o.value === value);
  const placeholderText = placeholder ?? t("all");

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label id={labelId} className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-border bg-surface-container-low px-3 text-sm text-foreground hover:border-ring transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? labelId : undefined}
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {selected?.label ?? placeholderText}
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id={listId}
          className="absolute z-50 mt-1 w-full min-w-[10rem] rounded-lg border border-border bg-popover p-1 shadow-lg"
          role="listbox"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => { onChange(undefined); setOpen(false); }}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            {placeholderText}
            {!value && <Check className="size-4 text-primary" />}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              {opt.label}
              {value === opt.value && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
