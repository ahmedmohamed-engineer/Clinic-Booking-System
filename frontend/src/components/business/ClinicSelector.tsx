"use client";

import type { ClinicRecord } from "@/types/models/clinic";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicSelectorProps {
  clinics: ClinicRecord[];
  selectedClinicId: string | null;
  onSelect: (clinicId: string) => void;
  isLoading?: boolean;
}

export function ClinicSelector({
  clinics,
  selectedClinicId,
  onSelect,
  isLoading,
}: ClinicSelectorProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-lg bg-surface-container-high"
          />
        ))}
      </div>
    );
  }

  if (clinics.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No clinics available at the moment.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clinics.map((clinic) => {
        const isSelected = selectedClinicId === clinic.id;
        return (
          <Card
            key={clinic.id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => onSelect(clinic.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(clinic.id);
              }
            }}
            className={cn(
              "cursor-pointer transition-all hover:border-primary focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-2 border-primary bg-primary/5 shadow-md"
                : "border-border bg-surface-container-lowest",
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">{clinic.name}</h3>
                    {clinic.city && (
                      <span className="text-xs text-muted-foreground">
                        {clinic.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                {clinic.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{clinic.address}</span>
                  </div>
                )}
                {clinic.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-primary" />
                    <span>{clinic.phone}</span>
                  </div>
                )}
              </div>

              {clinic.description && (
                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                  {clinic.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
