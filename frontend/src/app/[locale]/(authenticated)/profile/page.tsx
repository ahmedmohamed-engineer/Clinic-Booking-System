"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Building2, Mail, Pencil, Plus, Stethoscope, X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { usePatientProfile, useUpdateProfile } from "@/features/patients";
import { useDoctorProfile, useUpdateDoctorProfile } from "@/features/doctors";
import { AvatarUploader } from "@/components/business/AvatarUploader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/feedback/Skeleton";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { formatCurrency, formatDate, resolveDisplayName } from "@/lib/utils";

/* The edit forms bundle the date-picker calendar, popover, and select
   controls — a large chunk that only matters while the user is editing.
   They are split into their own chunk and fetched on first click of
   "Edit", so the read view of the profile stays light. */
const ProfileForm = dynamic(
  () =>
    import("@/components/business/ProfileForm").then((mod) => mod.ProfileForm),
  {
    loading: () => <Skeleton variant="form" className="h-56" />,
    ssr: false,
  },
);

const DoctorProfileForm = dynamic(
  () =>
    import("@/components/business/DoctorProfileForm").then(
      (mod) => mod.DoctorProfileForm,
    ),
  {
    loading: () => <Skeleton variant="form" className="h-56" />,
    ssr: false,
  },
);

function InfoRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-foreground">
        {children ?? value ?? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground" aria-label={t("notSetAria", { label })}>
            <Plus className="size-3" aria-hidden="true" />
            {t("notSet")}
          </span>
        )}
      </dd>
    </div>
  );
}

function formatGender(gender: string | null | undefined): string | undefined {
  if (!gender) return undefined;
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function PatientProfileContent() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { user, updateUser } = useAuth();
  const { data: patient, isPending, isError, refetch } = usePatientProfile();
  const { mutateAsync: updateProfile, isPending: isSaving } = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message={t("error")} onRetry={refetch} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="container-custom py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
          <Skeleton className="size-[150px] rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton variant="form" className="mt-4 h-40" />
          <Skeleton variant="form" className="h-28" />
        </div>
      </div>
    );
  }

  const displayName = resolveDisplayName(
    [patient.fullName, user?.fullName],
    user?.email,
    "Patient",
  );

  return (
    <main className="container-custom py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-1">
          <h1 className="heading-1">{t("title")}</h1>
          <p className="body-text">{t("patientSubtitle")}</p>
        </header>

        <section className="mt-8 flex flex-col items-center gap-4 border-b border-border pb-8">
          <AvatarUploader
            src={user?.avatarUrl ?? patient.avatarUrl}
            fallback={displayName}
            onSuccess={(avatarUrl) => updateUser({ avatarUrl })}
          />
          <h2 className="heading-1 max-w-full break-words text-center">{displayName}</h2>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("personalInfo")}</CardTitle>
              <CardAction>
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    {tc("edit")}
                  </Button>
                )}
              </CardAction>
            </CardHeader>
            {isEditing ? (
              <>
                <div className="border-t border-border" />
                <CardContent>
                  <ProfileForm
                    patient={patient}
                    formId="profile-form"
                    hideActions
                    onSubmit={async (data) => {
                      // Await the save so the form only closes (and the header
                      // name only changes) after the server confirms — otherwise
                      // a failed save would silently discard the edit.
                      await updateProfile(data);
                      if (data.fullName !== patient.fullName) {
                        updateUser({ fullName: data.fullName });
                      }
                    }}
                    isSubmitting={isSaving}
                    onSaveSuccess={() => setIsEditing(false)}
                  />
                </CardContent>
                <CardFooter className="flex-col justify-end gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <X className="size-4" aria-hidden="true" />
                    {tc("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    form="profile-form"
                    className="w-full sm:w-auto"
                    disabled={isSaving}
                  >
                    {isSaving ? tc("saving") : tc("save")}
                  </Button>
                </CardFooter>
              </>
            ) : (
              <CardContent>
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <InfoRow label={t("fullName")} value={displayName} />
                  <InfoRow
                    label={t("phone")}
                    value={patient.phone ?? undefined}
                  />
                  <InfoRow
                    label={t("gender")}
                    value={formatGender(patient.gender)}
                  />
                  <InfoRow
                    label={t("birthDate")}
                    value={patient.birthDate ? formatDate(patient.birthDate) : undefined}
                  />
                </dl>
              </CardContent>
            )}
          </Card>

          <AccountCard />
        </div>
      </div>
    </main>
  );
}

function DoctorProfileContent() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { user, updateUser } = useAuth();
  const { data: doctor, isPending, isError, refetch } = useDoctorProfile();
  const { mutateAsync: updateProfile, isPending: isSaving } = useUpdateDoctorProfile();
  const [isEditing, setIsEditing] = useState(false);

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message={t("error")} onRetry={refetch} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="container-custom py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
          <Skeleton className="size-[150px] rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton variant="form" className="mt-4 h-40" />
          <Skeleton variant="form" className="h-28" />
        </div>
      </div>
    );
  }

  const displayName = resolveDisplayName(
    [doctor.doctor.displayName, user?.fullName],
    user?.email,
    "Doctor",
  );

  return (
    <main className="container-custom py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-1">
          <h1 className="heading-1">{t("title")}</h1>
          <p className="body-text">{t("doctorSubtitle")}</p>
        </header>

        <section className="mt-8 flex flex-col items-center gap-4 border-b border-border pb-8">
          <AvatarUploader
            src={user?.avatarUrl ?? doctor.doctor.avatarUrl}
            fallback={displayName}
            onSuccess={(avatarUrl) => updateUser({ avatarUrl })}
          />
          <h2 className="heading-1 max-w-full break-words text-center">{displayName}</h2>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("professionalInfo")}</CardTitle>
              <CardAction>
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    {tc("edit")}
                  </Button>
                )}
              </CardAction>
            </CardHeader>
            {isEditing ? (
              <>
                <div className="border-t border-border" />
                <CardContent>
                  <DoctorProfileForm
                    doctor={doctor}
                    formId="doctor-profile-form"
                    hideActions
                    onSubmit={async (update) => {
                      // Await the save so the form only closes (and the header
                      // name only changes) after the server confirms.
                      await updateProfile(update);
                      if (update.fullName !== doctor.doctor.displayName && user) {
                        updateUser({ fullName: update.fullName });
                      }
                    }}
                    isSubmitting={isSaving}
                    onSaveSuccess={() => setIsEditing(false)}
                  />
                </CardContent>
                <CardFooter className="flex-col justify-end gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <X className="size-4" aria-hidden="true" />
                    {tc("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    form="doctor-profile-form"
                    className="w-full sm:w-auto"
                    disabled={isSaving}
                  >
                    {isSaving ? tc("saving") : tc("save")}
                  </Button>
                </CardFooter>
              </>
            ) : (
              <CardContent>
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <InfoRow label={t("fullName")} value={displayName} />
                  <InfoRow label={t("specialty")}>
                    <span className="flex min-w-0 items-center gap-2">
                      <Stethoscope
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 break-words">{doctor.doctor.specialtyName}</span>
                    </span>
                  </InfoRow>
                  <InfoRow label={t("clinic")}>
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 break-words">{doctor.doctor.clinicName}</span>
                    </span>
                  </InfoRow>
                  <InfoRow
                    label={t("fee")}
                    value={
                      doctor.consultationFee != null
                        ? formatCurrency(doctor.consultationFee)
                        : undefined
                    }
                  />
                </dl>
              </CardContent>
            )}
          </Card>

          <AccountCard />
        </div>
      </div>
    </main>
  );
}

function AccountCard() {
  const t = useTranslations("profile");
  const ta = useTranslations("admin");
  const { user } = useAuth();

  const roleLookup: Record<string, string> = {
    patient: ta("roles.patient"),
    doctor: ta("roles.doctor"),
    admin: ta("roles.admin"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-5">
          <InfoRow label={t("email")}>
            <span className="flex min-w-0 items-center gap-2">
              <Mail
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 break-words">{user?.email?.trim() || "—"}</span>
            </span>
          </InfoRow>
          <InfoRow
            label={t("role")}
            value={user?.role ? roleLookup[user.role] ?? user.role : "—"}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  return user?.role === "doctor" ? (
    <DoctorProfileContent />
  ) : (
    <PatientProfileContent />
  );
}