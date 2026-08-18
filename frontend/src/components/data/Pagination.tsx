"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPagePrefetch?: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  onPagePrefetch,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  onPageSizeChange,
  className,
}: PaginationProps) {
  const t = useTranslations("dataTable");

  if (totalPages <= 1 && !onPageSizeChange) return null;

  const handlePagePrefetch = (target: number) => {
    if (target >= 1 && target <= totalPages && target !== page) {
      onPagePrefetch?.(target);
    }
  };

  const pages: (number | "...")[] = [];
  const delta = 1;
  const start = Math.max(2, page - delta);
  const end = Math.min(totalPages - 1, page + delta);

  pages.push(1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      {onPageSizeChange && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("rowsPerPage")}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-border bg-surface-container-low px-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {t("pageOf", { page, total: totalPages })}
        </p>
        <nav className="flex items-center justify-center gap-1" aria-label={t("label")}>
        <Button
          variant="outline"
          size="xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          onMouseEnter={() => handlePagePrefetch(page - 1)}
          onFocus={() => handlePagePrefetch(page - 1)}
          aria-label={t("previous")}
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="xs"
              onClick={() => onPageChange(p)}
              onMouseEnter={() => handlePagePrefetch(p)}
              onFocus={() => handlePagePrefetch(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          onMouseEnter={() => handlePagePrefetch(page + 1)}
          onFocus={() => handlePagePrefetch(page + 1)}
          aria-label={t("next")}
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Button>
      </nav>
      </div>
    </div>
  );
}