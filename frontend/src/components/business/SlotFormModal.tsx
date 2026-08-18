"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
  createAppointmentSlotSchema,
  updateAppointmentSlotSchema,
  type CreateAppointmentSlotInput,
  type UpdateAppointmentSlotInput,
} from "@/schemas/slot";
import { SLOT_STATUSES } from "@/types/enums";
import { formatTime, toHHmm } from "@/lib/utils";
import type { DoctorReadModel } from "@/types/models/doctor";
import type { DoctorScheduleRecord } from "@/types/models/schedule";
import type { AppointmentSlotRecord } from "@/types/models/slot";
import { useApiError } from "@/hooks/useApiError";

interface SlotFormModalProps {
  open: boolean;
  onClose: () => void;
  slot?: AppointmentSlotRecord | null;
  doctors: DoctorReadModel[];
  schedules: DoctorScheduleRecord[];
  onSubmit: (data: CreateAppointmentSlotInput | UpdateAppointmentSlotInput) => void;
  isSubmitting?: boolean;
}

export function SlotFormModal({
  open,
  onClose,
  slot,
  doctors,
  schedules,
  onSubmit,
  isSubmitting,
}: SlotFormModalProps) {
  const t = useTranslations("adminForm");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { parse } = useApiError();
  const [doctorId, setDoctorId] = useState(slot?.doctorId ?? "");
  const [doctorScheduleId, setDoctorScheduleId] = useState(
    slot?.doctorScheduleId ?? "",
  );
  const [slotDate, setSlotDate] = useState(slot?.slotDate ?? "");
  const [startTime, setStartTime] = useState(toHHmm(slot?.startTime ?? ""));
  const [endTime, setEndTime] = useState(toHHmm(slot?.endTime ?? ""));
  const [status, setStatus] = useState(slot?.status ?? "available");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const doctorSchedules = schedules.filter((s) => s.doctorId === doctorId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const payload = {
      doctorId,
      doctorScheduleId,
      slotDate,
      startTime,
      endTime,
      status,
    };
    const result = slot
      ? updateAppointmentSlotSchema.safeParse(payload)
      : createAppointmentSlotSchema.safeParse(payload);

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
          <DialogTitle>{slot ? t("editSlot") : t("createSlot")}</DialogTitle>
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

          <div className="space-y-2">
            <Label htmlFor="doctorId">{t("doctor")}</Label>
            <Select
              value={doctorId}
              onValueChange={(value) => {
                setDoctorId(value ?? "");
                setDoctorScheduleId("");
              }}
              disabled={isSubmitting}
            >
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

          <div className="space-y-2">
            <Label htmlFor="doctorScheduleId">{t("schedule")}</Label>
            <Select
              value={doctorScheduleId}
              onValueChange={(value) => setDoctorScheduleId(value ?? "")}
              disabled={isSubmitting || doctorSchedules.length === 0}
            >
              <SelectTrigger id="doctorScheduleId" className="w-full">
                <SelectValue
                  placeholder={
                    doctorSchedules.length === 0
                      ? t("noScheduleForDoctor")
                      : t("selectSchedule")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {doctorSchedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {t("scheduleRange", {
                      start: formatTime(schedule.startTime, locale),
                      end: formatTime(schedule.endTime, locale),
                      minutes: schedule.slotDuration,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.doctorScheduleId && (
              <p className="text-xs text-destructive">
                {fieldErrors.doctorScheduleId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slotDate">{t("date")}</Label>
            <Input
              id="slotDate"
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              hasError={Boolean(fieldErrors.slotDate)}
              disabled={isSubmitting}
            />
            {fieldErrors.slotDate && (
              <p className="text-xs text-destructive">{fieldErrors.slotDate}</p>
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
            <Label htmlFor="status">{t("status")}</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as AppointmentSlotRecord["status"])}
              disabled={isSubmitting}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder={t("selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                {SLOT_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.status && (
              <p className="text-xs text-destructive">{fieldErrors.status}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : slot ? tc("save") : t("createSlot")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
