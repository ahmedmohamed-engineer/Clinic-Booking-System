"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (data: Record<string, FormDataEntryValue>) => Promise<void>;
  children: ReactNode;
  submitLabel?: string;
}

export function FormModal({
  open,
  onClose,
  title,
  onSubmit,
  children,
  submitLabel,
}: FormModalProps) {
  const t = useTranslations("common");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    try {
      const form = e.target as HTMLFormElement;
      const data = new FormData(form);
      const values = Object.fromEntries(data.entries());
      await onSubmit(values);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">{children}</div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : (submitLabel ?? t("save"))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
