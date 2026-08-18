"use client";

import { useState, useMemo, memo, type ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  sortable?: boolean;
  onRowClick?: (item: T) => void;
  emptyState?: React.ReactNode;
  className?: string;
}

interface DataTableRowProps<T> {
  item: T;
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

function DataTableRowInner<T extends object>({
  item,
  columns,
  onRowClick,
}: DataTableRowProps<T>) {
  return (
    <tr
      onClick={() => onRowClick?.(item)}
      className={cn(
        "border-b border-border last:border-0 transition-colors",
        onRowClick && "cursor-pointer hover:bg-muted/50",
      )}
    >
      {columns.map((col) => (
        <td key={col.key} className={cn("whitespace-nowrap px-4 py-3 text-sm text-foreground", col.className)}>
          {col.render
            ? col.render(item)
            : String((item as Record<string, unknown>)[col.key] ?? "")}
        </td>
      ))}
    </tr>
  );
}

const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner;

export function DataTable<T extends object>({
  columns,
  data,
  loading,
  sortable,
  onRowClick,
  emptyState,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (loading) {
    return (
      <div className={cn("overflow-x-auto rounded-lg border border-border", className)}>
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("whitespace-nowrap px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="shimmer h-4 w-3/4 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border", className)}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col) => {
              const canSort = sortable && col.sortable;
              return (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase",
                    canSort && "cursor-pointer select-none hover:text-foreground",
                    col.className,
                  )}
                  onClick={() => canSort && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {canSort && (
                      sortKey === col.key ? (
                        sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                      ) : (
                        <ChevronsUpDown className="size-3" />
                      )
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, i) => (
            <DataTableRow
              key={String((item as Record<string, unknown>).id ?? i)}
              item={item}
              columns={columns}
              onRowClick={onRowClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
