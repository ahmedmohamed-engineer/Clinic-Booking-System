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
  createPatientSchema,
  updatePatientSchema,
  type CreatePatientInput,
  type UpdatePatientInput,
} from "@/schemas/patient";
import type { PatientRecord } from "@/types/models/patient";
import type { UserRecord } from "@/types/models/user";
import { useApiError } from "@/hooks/useApiError";

interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  patient?: PatientRecord | null;
  users: UserRecord[];
  onSubmit: (data: CreatePatientInput | UpdatePatientInput) => void;
  isSubmitting?: boolean;
}

const toNullable = (value: string): string | null =>
  value.trim() === "" ? null : value.trim();

export function PatientFormModal({
  open,
  onClose,
  patient,
  users,
  onSubmit,
  isSubmitting,
}: PatientFormModalProps) {
  const { parse } = useApiError();
  const t = useTranslations("adminForm");
  const tc = useTranslations("common");
  const [userId, setUserId] = useState(patient?.userId ?? "");
  const [fullName, setFullName] = useState(patient?.fullName ?? "");
  const [phone, setPhone] = useState(patient?.phone ?? "");
  const [gender, setGender] = useState(patient?.gender ?? "");
  const [birthDate, setBirthDate] = useState(patient?.birthDate ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const payload = {
      ...(patient ? {} : { userId }),
      fullName: fullName.trim(),
      phone: toNullable(phone),
      gender: toNullable(gender),
      birthDate: toNullable(birthDate),
    };
    const result = patient
      ? updatePatientSchema.safeParse(payload)
      : createPatientSchema.safeParse(payload);

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
          <DialogTitle>{patient ? t("editPatient") : t("createPatient")}</DialogTitle>
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

          {!patient && (
            <div className="space-y-2">
              <Label htmlFor="userId">{t("user")}</Label>
              <Select value={userId} onValueChange={(value) => setUserId(value ?? "")} disabled={isSubmitting}>
                <SelectTrigger id="userId" className="w-full">
                  <SelectValue placeholder={t("selectUser")} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.userId && (
                <p className="text-xs text-destructive">{fieldErrors.userId}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              hasError={Boolean(fieldErrors.fullName)}
              disabled={isSubmitting}
            />
            {fieldErrors.fullName && (
              <p className="text-xs text-destructive">{fieldErrors.fullName}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phoneOptional")}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                hasError={Boolean(fieldErrors.phone)}
                disabled={isSubmitting}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-destructive">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">{t("genderOptional")}</Label>
              <Input
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                hasError={Boolean(fieldErrors.gender)}
                disabled={isSubmitting}
              />
              {fieldErrors.gender && (
                <p className="text-xs text-destructive">{fieldErrors.gender}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">{t("birthDateOptional")}</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              hasError={Boolean(fieldErrors.birthDate)}
              disabled={isSubmitting}
            />
            {fieldErrors.birthDate && (
              <p className="text-xs text-destructive">{fieldErrors.birthDate}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : patient ? tc("save") : t("createPatient")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
