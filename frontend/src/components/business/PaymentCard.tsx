"use client";

import { memo } from "react";
import { CreditCard, Receipt } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/business/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { PaymentReadModel } from "@/types/models/payment";

interface PaymentCardProps {
  payment: PaymentReadModel;
  onPay?: (payment: PaymentReadModel) => void;
  isPaying?: boolean;
}

export const PaymentCard = memo(function PaymentCard({
  payment,
  onPay,
  isPaying,
}: PaymentCardProps) {
  const t = useTranslations("business.paymentCard");
  const locale = useLocale();
  const canPay = payment.status === "pending" && Boolean(onPay);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-outline-variant sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Receipt className="size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">
            {formatCurrency(payment.amount, locale)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {payment.method.replace(/_/g, " ")} · {payment.doctor.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(payment.slot.date, payment.slot.startTime, locale)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="text-sm text-muted-foreground">
            {payment.transactionReference
              ? t("reference", { ref: payment.transactionReference })
              : t("noReference")}
          </p>
        </div>
        <StatusBadge status={payment.status} />
        {canPay && onPay && (
          <Button onClick={() => onPay(payment)} disabled={isPaying}>
            <CreditCard />
            {isPaying ? t("processing") : t("payNow")}
          </Button>
        )}
      </div>
    </div>
  );
});