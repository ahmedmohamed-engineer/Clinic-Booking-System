"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "size-4", md: "size-5", lg: "size-6" };

export function StarRating({
  rating,
  onChange,
  readonly = false,
  size = "md",
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const handleKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (readonly || !onChange) return;
      let next = rating;
      if (e.key === "ArrowRight") next = Math.min(5, rating + 1);
      else if (e.key === "ArrowLeft") next = Math.max(1, rating - 1);
      else return;
      e.preventDefault();
      onChange(next);
    },
    [readonly, onChange, rating],
  );

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={readonly ? "img" : "radiogroup"}
      aria-label={`${rating} out of 5 stars`}
      tabIndex={readonly ? -1 : 0}
      onKeyDown={handleKey}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer",
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                "transition-colors",
                filled
                  ? "fill-status-warning text-status-warning"
                  : "fill-none text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
