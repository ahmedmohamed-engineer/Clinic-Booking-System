"use client";

import type { SpecialtyRecord } from "@/types/models/specialty";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { BiroCircle } from "@/components/business/BiroCircle";

interface SpecialtySelectorProps {
  specialties: SpecialtyRecord[];
  selectedSpecialtyId: string | null;
  onSelect: (specialtyId: string) => void;
  isLoading?: boolean;
}

export function SpecialtySelector({
  specialties,
  selectedSpecialtyId,
  onSelect,
  isLoading,
}: SpecialtySelectorProps) {
  const t = useTranslations("specialtySelector");

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shimmer h-28 rounded-lg"
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  if (specialties.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {specialties.map((specialty) => {
        const isSelected = selectedSpecialtyId === specialty.id;
        return (
          <Card
            key={specialty.id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => onSelect(specialty.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(specialty.id);
              }
            }}
            className={cn(
              "cursor-pointer transition-all hover:border-primary focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/30"
                : "border-border bg-card",
            )}
          >
            {isSelected && (
              <BiroCircle
                className="absolute top-3 right-3 text-primary"
                data-testid="specialty-card-selected"
              />
            )}
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Stethoscope className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{specialty.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("hint")}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}