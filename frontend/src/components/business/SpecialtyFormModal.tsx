"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createSpecialtySchema,
  updateSpecialtySchema,
  type CreateSpecialtyInput,
  type UpdateSpecialtyInput,
} from "@/schemas/specialty";
import type { SpecialtyRecord } from "@/types/models/specialty";
import { useApiError } from "@/hooks/useApiError";

interface SpecialtyFormModalProps {
  open: boolean;
  onClose: () => void;
  specialty?: SpecialtyRecord | null;
  onSubmit: (data: CreateSpecialtyInput | UpdateSpecialtyInput) => void;
  isSubmitting?: boolean;
}

export function SpecialtyFormModal({
  open,
  onClose,
  specialty,
  onSubmit,
  isSubmitting,
}: SpecialtyFormModalProps) {
  const t = useTranslations("adminForm");
  const tc = useTranslations("common");
  const { parse } = useApiError();
  const [name, setName] = useState(specialty?.name ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const payload = { name: name.trim() };
    const result = specialty
      ? updateSpecialtySchema.safeParse(payload)
      : createSpecialtySchema.safeParse(payload);

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
          <DialogTitle>{specialty ? t("editSpecialty") : t("createSpecialty")}</DialogTitle>
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

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? tc("saving")
                : specialty
                  ? tc("save")
                  : t("createSpecialty")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
