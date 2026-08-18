"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updatePatientSchema, type UpdatePatientInput } from "@/schemas/patient";
import type { PatientRecord } from "@/types/models/patient";
import { formatDate } from "@/lib/utils";
import { ar as arLocale } from "react-day-picker/locale";
import { useApiError } from "@/hooks/useApiError";

interface ProfileFormProps {
  patient: PatientRecord;
  onSubmit: (data: UpdatePatientInput) => Promise<void> | void;
  isSubmitting?: boolean;
  onSaveSuccess?: () => void;
  /** Renders only the fields, no submit button — use with a footer's own Save. */
  formId?: string;
  hideActions?: boolean;
}

const GENDER_OPTIONS = ["male", "female", "other"];

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISODate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function ProfileForm({
  patient,
  onSubmit,
  isSubmitting,
  onSaveSuccess,
  formId,
  hideActions = false,
}: ProfileFormProps) {
  const tp = useTranslations("profile");
  const tf = useTranslations("adminForm");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { parse } = useApiError();
  const [fullName, setFullName] = useState(patient.fullName);
  const [phone, setPhone] = useState(patient.phone ?? "");
  const [gender, setGender] = useState(patient.gender ?? "");
  const [birthDate, setBirthDate] = useState(fromISODate(patient.birthDate));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setFieldErrors({});
    setFormError(null);

    const result = updatePatientSchema.safeParse({
      fullName,
      phone: phone.trim() === "" ? null : phone.trim(),
      gender: gender.trim() === "" ? null : gender.trim(),
      birthDate: birthDate ? toISODate(birthDate) : null,
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

    Promise.resolve(onSubmit(result.data))
      .then(() => onSaveSuccess?.())
      .catch((err: unknown) => {
        const { message } = parse(err);
        setFormError(message);
      });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate id={formId}>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">{tp("fullName")}</Label>
        <Input
          id="fullName"
          name="fullName"
          maxLength={255}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          hasError={Boolean(fieldErrors.fullName)}
          disabled={isSubmitting}
          aria-describedby={
            fieldErrors.fullName ? `${formId ?? "profile-form"}-fullName-error` : undefined
          }
        />
        {fieldErrors.fullName && (
          <p
            id={`${formId ?? "profile-form"}-fullName-error`}
            className="text-xs text-destructive"
          >
            {fieldErrors.fullName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{tp("phone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          maxLength={50}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hasError={Boolean(fieldErrors.phone)}
          disabled={isSubmitting}
          aria-describedby={
            fieldErrors.phone ? `${formId ?? "profile-form"}-phone-error` : undefined
          }
        />
        {fieldErrors.phone && (
          <p
            id={`${formId ?? "profile-form"}-phone-error`}
            className="text-xs text-destructive"
          >
            {fieldErrors.phone}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">{tp("gender")}</Label>
        <Select
          value={gender}
          onValueChange={(value) => setGender(value ?? "")}
          disabled={isSubmitting}
        >
          <SelectTrigger id="gender" className="w-full">
            <SelectValue placeholder={tf("selectGender")} />
          </SelectTrigger>
          <SelectContent>
            {GENDER_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.gender && (
          <p className="text-xs text-destructive">{fieldErrors.gender}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{tp("birthDate")}</Label>
        <Popover>
          <PopoverTrigger
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={birthDate ? "text-foreground" : "text-muted-foreground"}>
              {birthDate ? formatDate(birthDate, locale) : tf("selectDate")}
            </span>
            <CalendarIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={birthDate}
              onSelect={(date) => setBirthDate(date)}
              captionLayout="dropdown"
              startMonth={new Date(1900, 0)}
              endMonth={new Date(new Date().getFullYear(), 11)}
              disabled={{ after: new Date() }}
              locale={locale === "ar" ? arLocale : undefined}
            />
          </PopoverContent>
        </Popover>
        {fieldErrors.birthDate && (
          <p className="text-xs text-destructive">{fieldErrors.birthDate}</p>
        )}
      </div>

      {!hideActions && (
          <div className="flex justify-end">
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : tc("save")}
            </Button>
          </div>
        )}
    </form>
  );
}
