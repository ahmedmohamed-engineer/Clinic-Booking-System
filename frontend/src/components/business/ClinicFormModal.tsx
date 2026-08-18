"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createClinicSchema,
  updateClinicSchema,
  type CreateClinicInput,
  type UpdateClinicInput,
} from "@/schemas/clinic";
import type { ClinicRecord } from "@/types/models/clinic";
import { useApiError } from "@/hooks/useApiError";

interface ClinicFormModalProps {
  open: boolean;
  onClose: () => void;
  clinic?: ClinicRecord | null;
  onSubmit: (data: CreateClinicInput | UpdateClinicInput) => void;
  isSubmitting?: boolean;
}

const toNullable = (value: string): string | null =>
  value.trim() === "" ? null : value.trim();

export function ClinicFormModal({
  open,
  onClose,
  clinic,
  onSubmit,
  isSubmitting,
}: ClinicFormModalProps) {
  const t = useTranslations("adminForm");
  const tc = useTranslations("common");
  const { parse } = useApiError();
  const [name, setName] = useState(clinic?.name ?? "");
  const [phone, setPhone] = useState(clinic?.phone ?? "");
  const [address, setAddress] = useState(clinic?.address ?? "");
  const [city, setCity] = useState(clinic?.city ?? "");
  const [description, setDescription] = useState(clinic?.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const payload = {
      name: name.trim(),
      phone: toNullable(phone),
      address: toNullable(address),
      city: toNullable(city),
      description: toNullable(description),
    };
    const result = clinic
      ? updateClinicSchema.safeParse(payload)
      : createClinicSchema.safeParse(payload);

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
          <DialogTitle>{clinic ? t("editClinic") : t("createClinic")}</DialogTitle>
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
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              hasError={Boolean(fieldErrors.name)}
              disabled={isSubmitting}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

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
            <Label htmlFor="address">{t("address")}</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">{t("cityOptional")}</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              hasError={Boolean(fieldErrors.city)}
              disabled={isSubmitting}
            />
            {fieldErrors.city && (
              <p className="text-xs text-destructive">{fieldErrors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? tc("saving")
                : clinic
                  ? tc("save")
                  : t("createClinic")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
