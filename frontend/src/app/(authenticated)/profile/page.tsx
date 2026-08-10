"use client";

import { useState, type ReactNode } from "react";
import { Building2, Mail, Pencil, Plus, Stethoscope, X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { usePatientProfile, useUpdateProfile } from "@/features/patients";
import { useDoctorProfile, useUpdateDoctorProfile } from "@/features/doctors";
import { ProfileForm } from "@/components/business/ProfileForm";
import { DoctorProfileForm } from "@/components/business/DoctorProfileForm";
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

function InfoRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">
        {children ?? value ?? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground" aria-label={`${label} not set`}>
            <Plus className="size-3" aria-hidden="true" />
            Not set — click Edit to add
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

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function PatientProfileContent() {
  const { user, updateUser } = useAuth();
  const { data: patient, isPending, isError, refetch } = usePatientProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message="Could not load your profile." onRetry={refetch} />
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
          <h1 className="heading-1">Profile</h1>
          <p className="body-text">Manage your personal information.</p>
        </header>

        <section className="mt-8 flex flex-col items-center gap-4 border-b border-border pb-8">
          <AvatarUploader
            src={user?.avatarUrl ?? patient.avatarUrl}
            fallback={displayName}
            onSuccess={(avatarUrl) => updateUser({ avatarUrl })}
          />
          <h2 className="heading-1">{displayName}</h2>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardAction>
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
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
                    onSubmit={(data) => {
                      updateProfile(data);
                      if (data.fullName !== patient.fullName) {
                        updateUser({ fullName: data.fullName });
                      }
                    }}
                    isSubmitting={isSaving}
                    onSaveSuccess={() => setIsEditing(false)}
                  />
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <X className="size-4" aria-hidden="true" />
                    Cancel
                  </Button>
                  <Button type="submit" form="profile-form" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                </CardFooter>
              </>
            ) : (
              <CardContent>
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <InfoRow label="Full name" value={displayName} />
                  <InfoRow
                    label="Phone"
                    value={patient.phone ?? undefined}
                  />
                  <InfoRow
                    label="Gender"
                    value={formatGender(patient.gender)}
                  />
                  <InfoRow
                    label="Birth date"
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
  const { user, updateUser } = useAuth();
  const { data: doctor, isPending, isError, refetch } = useDoctorProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateDoctorProfile();
  const [isEditing, setIsEditing] = useState(false);

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message="Could not load your profile." onRetry={refetch} />
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
          <h1 className="heading-1">Profile</h1>
          <p className="body-text">Manage your professional information.</p>
        </header>

        <section className="mt-8 flex flex-col items-center gap-4 border-b border-border pb-8">
          <AvatarUploader
            src={user?.avatarUrl ?? doctor.doctor.avatarUrl}
            fallback={displayName}
            onSuccess={(avatarUrl) => updateUser({ avatarUrl })}
          />
          <h2 className="heading-1">{displayName}</h2>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardAction>
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
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
                    onSubmit={(update) => {
                      updateProfile(update);
                      if (update.fullName !== doctor.doctor.displayName && user) {
                        updateUser({ fullName: update.fullName });
                      }
                    }}
                    isSubmitting={isSaving}
                    onSaveSuccess={() => setIsEditing(false)}
                  />
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    <X className="size-4" aria-hidden="true" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="doctor-profile-form"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                </CardFooter>
              </>
            ) : (
              <CardContent>
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <InfoRow label="Full name" value={displayName} />
                  <InfoRow label="Specialty">
                    <span className="flex items-center gap-2">
                      <Stethoscope
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {doctor.doctor.specialtyName}
                    </span>
                  </InfoRow>
                  <InfoRow label="Clinic">
                    <span className="flex items-center gap-2">
                      <Building2
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {doctor.doctor.clinicName}
                    </span>
                  </InfoRow>
                  <InfoRow
                    label="Consultation fee"
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
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-5">
          <InfoRow label="Email">
            <span className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
              {user?.email ?? "—"}
            </span>
          </InfoRow>
          <InfoRow label="Role" value={user ? formatRole(user.role) : undefined} />
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