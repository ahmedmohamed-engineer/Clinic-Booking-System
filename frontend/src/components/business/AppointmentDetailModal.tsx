"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { StatusBadge } from "@/components/business/StatusBadge";
import { updateAppointmentSchema, type UpdateAppointmentInput } from "@/schemas/appointment";
import { APPOINTMENT_STATUSES } from "@/types/enums";
import { formatDateTime } from "@/lib/utils";
import type { AppointmentReadModel } from "@/types/models/appointment";
import { useApiError } from "@/hooks/useApiError";

interface AppointmentDetailModalProps {
  open: boolean;
  onClose: () => void;
  appointment: AppointmentReadModel;
  onSubmit: (data: UpdateAppointmentInput) => void;
  isSubmitting?: boolean;
}

export function AppointmentDetailModal({
  open,
  onClose,
  appointment,
  onSubmit,
  isSubmitting,
}: AppointmentDetailModalProps) {
  const { parse } = useApiError();
  const t = useTranslations("adminForm");
  const tc = useTranslations("common");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const [status, setStatus] = useState(appointment.status);
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const result = updateAppointmentSchema.safeParse({
      status,
      notes: notes.trim() === "" ? null : notes.trim(),
    });

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
          <DialogTitle>{t("appointmentDetails")}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">
                {t("patientLabel", { name: appointment.patient.fullName })}
              </span>
              <span className="text-muted-foreground">
                {t("slotLabel", { date: formatDateTime(appointment.slot.date, appointment.slot.startTime, locale) })}
              </span>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">{t("status")}</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as AppointmentReadModel["status"])
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder={t("selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_STATUSES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {tStatus(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.status && (
                <p className="text-xs text-destructive">{fieldErrors.status}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                aria-invalid={Boolean(fieldErrors.notes)}
                disabled={isSubmitting}
              />
              {fieldErrors.notes && (
                <p className="text-xs text-destructive">{fieldErrors.notes}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                {tc("close")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? tc("saving") : tc("save")}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
