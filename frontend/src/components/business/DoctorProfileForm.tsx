"use client";

import { useState } from "react";
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
    setFieldErrors({});
    setFormError(null);

    const result = updateMyDoctorSchema.safeParse({
      fullName,
      consultationFee: Number(consultationFee),
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
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
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
          <Label htmlFor="consultationFee">Consultation fee</Label>
          <Input
            id="consultationFee"
            name="consultationFee"
            type="number"
            min="0"
            step="0.01"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
            hasError={Boolean(fieldErrors.consultationFee)}
            disabled={isSubmitting}
          />
          {fieldErrors.consultationFee && (
            <p className="text-xs text-destructive">{fieldErrors.consultationFee}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="experienceYears">Experience (years)</Label>
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min="0"
            step="1"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            hasError={Boolean(fieldErrors.experienceYears)}
            disabled={isSubmitting}
          />
          {fieldErrors.experienceYears && (
            <p className="text-xs text-destructive">{fieldErrors.experienceYears}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={isSubmitting}
        />
        {fieldErrors.bio && (
          <p className="text-xs text-destructive">{fieldErrors.bio}</p>
        )}
      </div>

      {!hideActions && (
        <div className="flex justify-end">
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      )}
    </form>
  );
}
