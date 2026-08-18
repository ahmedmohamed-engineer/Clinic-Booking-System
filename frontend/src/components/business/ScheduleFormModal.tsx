"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createDoctorScheduleSchema,
  createMyDoctorScheduleSchema,
  updateDoctorScheduleSchema,
  type CreateDoctorScheduleInput,
  type CreateMyDoctorScheduleInput,
  type UpdateDoctorScheduleInput,
} from "@/schemas/schedule";
import type { DoctorReadModel } from "@/types/models/doctor";
import type { DoctorScheduleRecord } from "@/types/models/schedule";
import { useApiError } from "@/hooks/useApiError";
import { toHHmm } from "@/lib/utils";

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

interface ScheduleFormModalProps {
  open: boolean;
  onClose: () => void;
  schedule?: DoctorScheduleRecord | null;
  doctors?: DoctorReadModel[];
  withDoctorField?: boolean;
  onSubmit: (
    data: CreateDoctorScheduleInput | CreateMyDoctorScheduleInput | UpdateDoctorScheduleInput,
  ) => void;
  isSubmitting?: boolean;
}

export function ScheduleFormModal({
  open,
  onClose,
  schedule,
  doctors = [],
  withDoctorField = true,
  onSubmit,
  isSubmitting,
}: ScheduleFormModalProps) {
  const t = useTranslations("adminForm");
  const td = useTranslations("weekdays");
  const tc = useTranslations("common");
  const dayLabels = DAYS.map((day) => td(day));
  const { parse } = useApiError();
  const [doctorId, setDoctorId] = useState(schedule?.doctorId ?? "");
  const [weekday, setWeekday] = useState(
    schedule ? String(schedule.weekday) : "",
  );
  const [startTime, setStartTime] = useState(toHHmm(schedule?.startTime ?? ""));
  const [endTime, setEndTime] = useState(toHHmm(schedule?.endTime ?? ""));
  const [slotDuration, setSlotDuration] = useState(
    schedule ? String(schedule.slotDuration) : "30",
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const basePayload = {
      weekday: Number(weekday),
      startTime,
      endTime,
      slotDuration: Number(slotDuration),
    };
    const payload = withDoctorField ? { ...basePayload, doctorId } : basePayload;
    const result = schedule
      ? updateDoctorScheduleSchema.safeParse(payload)
      : withDoctorField
        ? createDoctorScheduleSchema.safeParse(payload)
        : createMyDoctorScheduleSchema.safeParse(payload);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    Promise.resolve(onSubmit(result.data)).catch((err: unknown) => {
      const { message } = parse(err);
      setFormError(message);
    });
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{schedule ? t("editSchedule") : t("createSchedule")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4" noValidate>
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {formError}
            </div>
          )}

          {withDoctorField && (
            <div className="space-y-2">
              <Label htmlFor="doctorId">{t("doctor")}</Label>
              <Select value={doctorId} onValueChange={(value) => setDoctorId(value ?? "")} disabled={isSubmitting}>
                <SelectTrigger id="doctorId" className="w-full">
                  <SelectValue placeholder={t("selectDoctor")} />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.doctor.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.doctorId && (
                <p className="text-xs text-destructive">{fieldErrors.doctorId}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="weekday">{t("weekday")}</Label>
            <Select
              value={weekday}
              onValueChange={(value) => setWeekday(value ?? "")}
              disabled={isSubmitting}
            >
              <SelectTrigger id="weekday" className="w-full">
                <SelectValue placeholder={t("selectDay")} />
              </SelectTrigger>
              <SelectContent>
                {dayLabels.map((day, index) => (
                  <SelectItem key={day} value={String(index)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.weekday && (
              <p className="text-xs text-destructive">{fieldErrors.weekday}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">{t("startTime")}</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                hasError={Boolean(fieldErrors.startTime)}
                disabled={isSubmitting}
              />
              {fieldErrors.startTime && (
                <p className="text-xs text-destructive">{fieldErrors.startTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">{t("endTime")}</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                hasError={Boolean(fieldErrors.endTime)}
                disabled={isSubmitting}
              />
              {fieldErrors.endTime && (
                <p className="text-xs text-destructive">{fieldErrors.endTime}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slotDuration">{t("slotDurationMinutes")}</Label>
            <Input
              id="slotDuration"
              type="number"
              min="1"
              step="1"
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              hasError={Boolean(fieldErrors.slotDuration)}
              disabled={isSubmitting}
            />
            {fieldErrors.slotDuration && (
              <p className="text-xs text-destructive">{fieldErrors.slotDuration}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? tc("saving")
                : schedule
                  ? tc("save")
                  : t("createSchedule")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
