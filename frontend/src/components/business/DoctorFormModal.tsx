"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
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
  createDoctorSchema,
  updateDoctorSchema,
  type CreateDoctorInput,
  type UpdateDoctorInput,
} from "@/schemas/doctor";
import type { ClinicRecord } from "@/types/models/clinic";
import type { SpecialtyRecord } from "@/types/models/specialty";
import type { UserRecord } from "@/types/models/user";
import type { DoctorRecord } from "@/types/models/doctor";
import { useApiError } from "@/hooks/useApiError";
import { getUsersAdmin } from "@/features/users/api/users-admin";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DoctorFormModalProps {
  open: boolean;
  onClose: () => void;
  doctor?: DoctorRecord | null;
  clinics: ClinicRecord[];
  specialties: SpecialtyRecord[];
  onSubmit: (data: CreateDoctorInput | UpdateDoctorInput) => void | Promise<void>;
  isSubmitting?: boolean;
}

const roleClass: Record<string, string> = {
  patient: "border-status-info/25 bg-status-info/10 text-status-info",
  doctor: "border-status-success/25 bg-status-success/10 text-status-success",
  admin: "border-primary/25 bg-primary/10 text-primary",
};

function RolePill({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        roleClass[role] ?? "border-border text-muted-foreground",
      )}
    >
      {role}
    </span>
  );
}

export function DoctorFormModal({
  open,
  onClose,
  doctor,
  clinics,
  specialties,
  onSubmit,
  isSubmitting,
}: DoctorFormModalProps) {
  const t = useTranslations("adminForm");
  const tc = useTranslations("common");
  const { parse } = useApiError();
  const [userId, setUserId] = useState(doctor?.userId ?? "");
  const [clinicId, setClinicId] = useState(doctor?.clinicId ?? "");
  const [specialtyId, setSpecialtyId] = useState(doctor?.specialtyId ?? "");
  const [consultationFee, setConsultationFee] = useState(
    doctor ? String(doctor.consultationFee) : "",
  );
  const [experienceYears, setExperienceYears] = useState(
    doctor ? String(doctor.experienceYears) : "",
  );
  const [bio, setBio] = useState(doctor?.bio ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserRecord[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "done">("idle");

  useEffect(() => {
    if (doctor) return;
    const query = searchQuery.trim();
    if (query.length < 2) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await getUsersAdmin({ search: query, limit: 10 });
        if (active) {
          setSearchResults(res.data);
          setSearchStatus("done");
        }
      } catch {
        if (active) {
          setSearchResults([]);
          setSearchStatus("done");
        }
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, doctor]);

  const matchedUser = useMemo(
    () => (userId ? searchResults.find((u) => u.id === userId) : undefined),
    [userId, searchResults],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const payload = {
      ...(doctor ? {} : { userId }),
      clinicId,
      specialtyId,
      consultationFee: Number(consultationFee),
      experienceYears: experienceYears === "" ? undefined : Number(experienceYears),
      bio: bio.trim() === "" ? null : bio.trim(),
    };
    const result = doctor
      ? updateDoctorSchema.safeParse(payload)
      : createDoctorSchema.safeParse(payload);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    try {
      await onSubmit(result.data);
    } catch (err: unknown) {
      const { message } = parse(err);
      setFormError(message);
      if (!doctor) {
        setFieldErrors((prev) => ({ ...prev, userId: message }));
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{doctor ? t("editDoctor") : t("createDoctor")}</DialogTitle>
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

          {!doctor && (
            <div className="space-y-2">
              <Label htmlFor="userSearch">{t("user")}</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="userSearch"
                  type="search"
                  placeholder={t("userSearch")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setUserId("");
                    setSearchStatus(e.target.value.trim().length >= 2 ? "searching" : "idle");
                    setSearchResults([]);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.userId;
                      return next;
                    });
                  }}
                  className="ps-9"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("typeToSearch")}
              </p>

              {matchedUser ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <Avatar
                    src={matchedUser.avatarUrl}
                    fallback={matchedUser.fullName ?? matchedUser.email}
                    className="size-8 shrink-0"
                    width={32}
                    height={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {matchedUser.fullName ?? matchedUser.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {matchedUser.email}
                    </p>
                  </div>
                  <RolePill role={matchedUser.role} />
                </div>
              ) : searchStatus === "searching" ? (
                <p className="text-xs text-muted-foreground">{t("searching")}</p>
              ) : searchStatus === "done" && searchResults.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("noAccountFound")}
                </p>
              ) : searchStatus === "done" ? (
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        if (user.role !== "doctor") {
                          setFieldErrors((prev) => ({
                            ...prev,
                            userId: t("notDoctor"),
                          }));
                          return;
                        }
                        setUserId(user.id);
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.userId;
                          return next;
                        });
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none"
                    >
                      <Avatar
                        src={user.avatarUrl}
                        fallback={user.fullName ?? user.email}
                        className="size-8 shrink-0"
                        width={32}
                        height={32}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {user.fullName ?? user.email}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </span>
                      <RolePill role={user.role} />
                    </button>
                  ))}
                </div>
              ) : null}

              {fieldErrors.userId && (
                <p className="text-xs text-destructive">{fieldErrors.userId}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="clinicId">{t("clinic")}</Label>
            <Select value={clinicId} onValueChange={(value) => setClinicId(value ?? "")} disabled={isSubmitting}>
              <SelectTrigger id="clinicId" className="w-full">
                <SelectValue placeholder={t("selectClinic")} />
              </SelectTrigger>
              <SelectContent>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.clinicId && (
              <p className="text-xs text-destructive">{fieldErrors.clinicId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialtyId">{t("specialty")}</Label>
            <Select
              value={specialtyId}
              onValueChange={(value) => setSpecialtyId(value ?? "")}
              disabled={isSubmitting}
            >
              <SelectTrigger id="specialtyId" className="w-full">
                <SelectValue placeholder={t("selectSpecialty")} />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.specialtyId && (
              <p className="text-xs text-destructive">{fieldErrors.specialtyId}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consultationFee">{t("consultationFee")}</Label>
              <Input
                id="consultationFee"
                type="number"
                min="0"
                step="0.01"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                hasError={Boolean(fieldErrors.consultationFee)}
                disabled={isSubmitting}
              />
              {fieldErrors.consultationFee && (
                <p className="text-xs text-destructive">
                  {fieldErrors.consultationFee}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceYears">{t("experienceYears")}</Label>
              <Input
                id="experienceYears"
                type="number"
                min="0"
                step="1"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                hasError={Boolean(fieldErrors.experienceYears)}
                disabled={isSubmitting}
              />
              {fieldErrors.experienceYears && (
                <p className="text-xs text-destructive">
                  {fieldErrors.experienceYears}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t("bio")}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : doctor ? tc("save") : t("createDoctor")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
