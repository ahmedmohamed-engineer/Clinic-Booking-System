"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: "danger" | "success";
  confirmLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  variant = "danger",
  confirmLabel,
  isLoading,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  const Icon = variant === "danger" ? AlertTriangle : CheckCircle;
  const iconColor = variant === "danger" ? "text-destructive" : "text-success";

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent showCloseButton={false}>
        <div className="flex flex-col items-center gap-4 text-center">
          <Icon className={iconColor} aria-hidden="true" />
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {t("cancel")}
            </Button>
            <Button
              variant={variant === "danger" ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading
                ? t("loading")
                : confirmLabel ??
                  (variant === "danger" ? t("delete") : t("confirm"))}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
