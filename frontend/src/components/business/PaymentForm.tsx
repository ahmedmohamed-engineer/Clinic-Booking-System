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
import { updatePaymentSchema, type UpdatePaymentInput } from "@/schemas/payment";
import { PAYMENT_METHODS } from "@/types/enums";
import type { PaymentRecord } from "@/types/models/payment";
import { useApiError } from "@/hooks/useApiError";

interface PaymentFormProps {
  payment: PaymentRecord;
  onSubmit: (data: UpdatePaymentInput) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function PaymentForm({ payment, onSubmit, isSubmitting }: PaymentFormProps) {
  const t = useTranslations("adminForm");
  const { parse } = useApiError();
  const [method, setMethod] = useState(payment.method);
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
      method,
      transactionReference:
        transactionReference.trim() === "" ? null : transactionReference.trim(),
      status: "paid",
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          name="amount"
          type="number"
          value={payment.amount}
          readOnly
          aria-readonly="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">{t("paymentMethod")}</Label>
        <Select
          value={method}
          onValueChange={(value) => setMethod(value as typeof method)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="method" className="w-full">
            <SelectValue placeholder={t("selectPaymentMethod")} />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((option) => (
              <SelectItem key={option} value={option}>
                {option.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.method && (
          <p className="text-xs text-destructive">{fieldErrors.method}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transactionReference">{t("transactionReference")}</Label>
        <Input
          id="transactionReference"
          name="transactionReference"
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

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submitPayment")}
        </Button>
      </div>
    </form>
  );
}
