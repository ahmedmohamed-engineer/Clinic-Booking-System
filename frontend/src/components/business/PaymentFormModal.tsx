"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updatePaymentSchema, type UpdatePaymentInput } from "@/schemas/payment";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/types/enums";
import type { PaymentRecord } from "@/types/models/payment";
import { useApiError } from "@/hooks/useApiError";

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  payment: PaymentRecord;
  onSubmit: (data: UpdatePaymentInput) => void;
  isSubmitting?: boolean;
}

export function PaymentFormModal({
  open,
  onClose,
  payment,
  onSubmit,
  isSubmitting,
}: PaymentFormModalProps) {
  const { parse } = useApiError();
  const t = useTranslations("adminForm");
  const tc = useTranslations("common");
  const tp = useTranslations("admin");
  const tStatus = useTranslations("status");
  const [amount, setAmount] = useState(String(payment.amount));
  const [method, setMethod] = useState(payment.method);
  const [status, setStatus] = useState(payment.status);
  const [transactionReference, setTransactionReference] = useState(
    payment.transactionReference ?? "",
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const result = updatePaymentSchema.safeParse({
      amount: Number(amount),
      method,
      status,
      transactionReference:
        transactionReference.trim() === "" ? null : transactionReference.trim(),
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

    Promise.resolve(onSubmit(result.data)).catch((err: unknown) => {
      const { message } = parse(err);
      setFormError(message);
    });
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editPayment")}</DialogTitle>
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
            <Label htmlFor="amount">{t("amount")}</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hasError={Boolean(fieldErrors.amount)}
              disabled={isSubmitting}
            />
            {fieldErrors.amount && (
              <p className="text-xs text-destructive">{fieldErrors.amount}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="method">{t("method")}</Label>
              <Select
                value={method}
                onValueChange={(value) => setMethod(value as PaymentRecord["method"])}
                disabled={isSubmitting}
              >
                <SelectTrigger id="method" className="w-full">
                  <SelectValue placeholder={t("selectMethod")} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {tp(`payMethods.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.method && (
                <p className="text-xs text-destructive">{fieldErrors.method}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("status")}</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as PaymentRecord["status"])}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder={t("selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {tStatus(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.status && (
                <p className="text-xs text-destructive">{fieldErrors.status}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionReference">{t("transactionReference")}</Label>
            <Input
              id="transactionReference"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              hasError={Boolean(fieldErrors.transactionReference)}
              disabled={isSubmitting}
            />
            {fieldErrors.transactionReference && (
              <p className="text-xs text-destructive">
                {fieldErrors.transactionReference}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : tc("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
