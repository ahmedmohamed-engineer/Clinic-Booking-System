"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateMyDoctorSchema, type UpdateMyDoctorInput } from "@/schemas/doctor";
import type { DoctorReadModel } from "@/types/models/doctor";
import { useApiError } from "@/hooks/useApiError";

interface DoctorProfileFormProps {
  doctor: DoctorReadModel;
  onSubmit: (data: UpdateMyDoctorInput) => Promise<void> | void;
  isSubmitting?: boolean;
  onSaveSuccess?: () => void;
  /** Renders only the fields, no submit button — use with a footer's own Save. */
  formId?: string;
  hideActions?: boolean;
}

export function DoctorProfileForm({
  doctor,
  onSubmit,
  isSubmitting,
  onSaveSuccess,
  formId,
  hideActions = false,
}: DoctorProfileFormProps) {
  const tp = useTranslations("profile");
  const tf = useTranslations("adminForm");
  const tc = useTranslations("common");
  const { parse } = useApiError();
  const [fullName, setFullName] = useState(doctor.doctor.displayName);
  const [consultationFee, setConsultationFee] = useState(
    String(Number(doctor.consultationFee)),
  );
  const [experienceYears, setExperienceYears] = useState(
    String(doctor.experienceYears),
  );
  const [bio, setBio] = useState(doctor.bio ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setFieldErrors({});
    setFormError(null);

    const fee = consultationFee.trim();
    if (fee === "") {
      setFieldErrors({ consultationFee: "Consultation fee is required" });
      return;
    }

    const result = updateMyDoctorSchema.safeParse({
      fullName,
      consultationFee: Number(fee),
      experienceYears: experienceYears === "" ? undefined : Number(experienceYears),
      bio: bio.trim() === "" ? null : bio.trim(),
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
            fieldErrors.fullName ? `${formId ?? "doctor-profile-form"}-fullName-error` : undefined
          }
        />
        {fieldErrors.fullName && (
          <p
            id={`${formId ?? "doctor-profile-form"}-fullName-error`}
            className="text-xs text-destructive"
          >
            {fieldErrors.fullName}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="consultationFee">{tf("consultationFee")}</Label>
          <Input
            id="consultationFee"
            name="consultationFee"
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
            hasError={Boolean(fieldErrors.consultationFee)}
            disabled={isSubmitting}
            aria-describedby={
              fieldErrors.consultationFee
                ? `${formId ?? "doctor-profile-form"}-consultationFee-error`
                : undefined
            }
          />
          {fieldErrors.consultationFee && (
            <p
              id={`${formId ?? "doctor-profile-form"}-consultationFee-error`}
              className="text-xs text-destructive"
            >
              {fieldErrors.consultationFee}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="experienceYears">{tf("experienceYears")}</Label>
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min="0"
            max="100"
            step="1"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            hasError={Boolean(fieldErrors.experienceYears)}
            disabled={isSubmitting}
            aria-describedby={
              fieldErrors.experienceYears
                ? `${formId ?? "doctor-profile-form"}-experienceYears-error`
                : undefined
            }
          />
          {fieldErrors.experienceYears && (
            <p
              id={`${formId ?? "doctor-profile-form"}-experienceYears-error`}
              className="text-xs text-destructive"
            >
              {fieldErrors.experienceYears}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{tf("bio")}</Label>
        <Textarea
          id="bio"
          name="bio"
          maxLength={1000}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={isSubmitting}
        />
        {fieldErrors.bio && (
          <p
            id={`${formId ?? "doctor-profile-form"}-bio-error`}
            className="text-xs text-destructive"
          >
            {fieldErrors.bio}
          </p>
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
