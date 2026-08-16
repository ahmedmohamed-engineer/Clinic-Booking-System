"use client";

import { memo } from "react";

import type { AppointmentSlotRecord } from "@/types/models/slot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, Info } from "lucide-react";
import { cn, formatTime, toISODateString } from "@/lib/utils";
import { BiroCircle } from "@/components/business/BiroCircle";

interface SlotPickerProps {
  slots: AppointmentSlotRecord[];
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  isLoading?: boolean;
}

interface SlotButtonProps {
  slot: AppointmentSlotRecord;
  isSelected: boolean;
  onSelect: (slotId: string) => void;
}

function SlotButton({ slot, isSelected, onSelect }: SlotButtonProps) {
  const isAvailable = slot.status === "available";
  return (
    <Button
      type="button"
      variant={isSelected ? "default" : "outline"}
      disabled={!isAvailable}
      aria-pressed={isSelected}
      onClick={() => onSelect(slot.id)}
      className={cn(
        "relative h-12 flex-col justify-center text-xs font-medium transition-colors",
        isSelected
          ? "bg-primary text-primary-foreground shadow-md"
          : "border-status-success/25 bg-status-success/10 text-on-surface hover:border-primary hover:bg-status-success/15",
      )}
    >
      <span className="tabular">{formatTime(slot.startTime)}</span>
      <span className="tabular text-[10px] opacity-75">
        {formatTime(slot.endTime)}
      </span>
      {isSelected && (
        <BiroCircle className="absolute -top-2 -right-2 size-5 bg-card rounded-full text-primary" />
      )}
    </Button>
  );
}

const areSlotButtonPropsEqual = (
  prev: SlotButtonProps,
  next: SlotButtonProps,
): boolean => {
  // The parent hands down a fresh `onSelect` closure on every render, so it is
  // deliberately excluded from the comparison (its behavior is stable — it only
  // captures the slot id). Compare the data that actually changes the button's
  // rendered output; picking a slot then re-renders just the affected buttons
  // instead of the whole grid.
  return (
    prev.slot.id === next.slot.id &&
    prev.slot.status === next.slot.status &&
    prev.slot.startTime === next.slot.startTime &&
    prev.slot.endTime === next.slot.endTime &&
    prev.isSelected === next.isSelected
  );
};

const MemoizedSlotButton = memo(SlotButton, areSlotButtonPropsEqual);

export function SlotPicker({
  slots,
  selectedSlotId,
  onSelectSlot,
  selectedDate,
  onDateChange,
  isLoading,
}: SlotPickerProps) {
  const todayStr = toISODateString(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor="slot-date" className="text-sm font-medium text-foreground">
            Select Date
          </Label>
          <p className="text-xs text-muted-foreground">
            Choose a date to view available appointment slots.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <CalendarIcon className="size-5 shrink-0 text-primary" />
          <Input
            id="slot-date"
            type="date"
            min={todayStr}
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full bg-card sm:w-auto"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Clock className="size-4 text-primary" />
          <span>Available Time Slots</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="shimmer h-12 rounded-md"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-muted-foreground">
            No available slots for this date. Please select another date.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {slots.map((slot) => (
              <MemoizedSlotButton
                key={slot.id}
                slot={slot}
                isSelected={selectedSlotId === slot.id}
                onSelect={onSelectSlot}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-md bg-primary/5 p-3 text-xs text-primary">
        <Info className="size-4 shrink-0" />
        <span>All times are shown in Africa/Cairo (EG). Select a slot to proceed.</span>
      </div>
    </div>
  );
}