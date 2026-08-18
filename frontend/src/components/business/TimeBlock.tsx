"use client";

import { memo } from "react";
import { useLocale } from "next-intl";
import { Clock } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

interface TimeBlockProps {
  startTime: string;
  endTime: string;
  className?: string;
}

export const TimeBlock = memo(function TimeBlock({
  startTime,
  endTime,
  className,
}: TimeBlockProps) {
  const locale = useLocale();
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-status-success/25 bg-status-success/10 px-3 py-2 text-sm font-medium text-foreground",
        className,
      )}
    >
      <Clock className="size-4 shrink-0 text-status-success" aria-hidden="true" />
      <span className="tabular">
        {formatTime(startTime, locale)} – {formatTime(endTime, locale)}
      </span>
    </div>
  );
});