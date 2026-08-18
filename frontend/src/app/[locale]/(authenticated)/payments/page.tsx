"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { CreditCard, Receipt, Wallet } from "lucide-react";
import { useMyAppointments } from "@/features/appointments";
import { useMyPayments, useUpdateMyPayment, useCreatePayment } from "@/features/payments";
import { PaymentCard } from "@/components/business/PaymentCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/feedback/Skeleton";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/business/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PaymentRecord } from "@/types/models/payment";
import type { AppointmentReadModel } from "@/types/models/appointment";
import type { UpdatePaymentInput } from "@/schemas/payment";

const PaymentForm = dynamic(
  () => import("@/components/business/PaymentForm").then((mod) => mod.PaymentForm),
  { loading: () => <Skeleton variant="form" /> },
);

function needsPayment(appointment: AppointmentReadModel): boolean {
  return (
    appointment.status === "completed" &&
    (appointment.paymentStatus === null ||
      appointment.paymentStatus === "pending" ||
      appointment.paymentStatus === "failed")
  );
}

export default function PatientPaymentsPage() {
  const t = useTranslations("paymentsPage");
  const locale = useLocale();
  const { data: appointments, isPending, isError, refetch } = useMyAppointments();
  const { data: payments, isPending: isPaymentsPending } = useMyPayments();
  const { mutate: updateMyPayment, isPending: isPaying } = useUpdateMyPayment();
  const { mutate: createPayment, isPending: isCreating } = useCreatePayment();
  const [selected, setSelected] = useState<PaymentRecord | null>(null);

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message={t("error")} onRetry={refetch} />
      </div>
    );
  }

  if (isPending || isPaymentsPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton variant="card" className="h-20" />
        <Skeleton variant="card" className="h-20" />
      </div>
    );
  }

  const due = (appointments ?? []).filter(needsPayment);
  const paymentByAppointment = new Map(
    (payments ?? []).map((payment) => [payment.appointmentId, payment]),
  );

  const history = (payments ?? []).filter(
    (payment) => !due.some((appointment) => appointment.id === payment.appointmentId),
  );

  const openPay = (appointment: AppointmentReadModel) => {
    const existing = paymentByAppointment.get(appointment.id);
    if (existing) {
      setSelected(existing);
      return;
    }
    createPayment(
      {
        appointmentId: appointment.id,
        amount: appointment.doctor.consultationFee ?? 0,
        method: "card",
        status: "pending",
      },
      {
        onSuccess: (created) => setSelected(created),
      },
    );
  };

  const empty = due.length === 0 && history.length === 0;

  return (
    <div className="container-custom flex flex-col gap-8 p-6">
      <header className="animate-fade-in flex flex-col gap-2">
        <h1 className="heading-1">{t("title")}</h1>
        <p className="body-text">
          {t("subtitle")}
        </p>
      </header>

      {empty ? (
        <div className="animate-fade-in rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Wallet className="size-12 text-primary" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
          />
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="heading-2">
              {t("completeSection", { count: due.length })}
            </h2>
            {due.length === 0 ? (
              <div className="rounded-xl border border-border bg-card">
                <EmptyState
                  icon={<CreditCard className="size-12 text-primary" />}
                  title={t("dueEmptyTitle")}
                  description={t("dueEmptyDesc")}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {due.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-outline-variant sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Receipt className="size-6" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium text-foreground">
                          {appointment.doctor.displayName}
                        </h3>
                        <p className="truncate text-sm text-muted-foreground">
                          {appointment.doctor.specialtyName} ·{" "}
                          {appointment.doctor.clinicName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(appointment.slot.date, appointment.slot.startTime, locale)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end sm:justify-between">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-foreground">
                          {appointment.doctor.consultationFee !== undefined
                            ? formatCurrency(appointment.doctor.consultationFee, locale)
                            : ""}
                        </p>
                        <StatusBadge status={appointment.paymentStatus ?? "pending"} />
                      </div>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={() => openPay(appointment)}
                        disabled={isCreating}
                      >
                        <CreditCard />
                        {isCreating ? t("preparing") : t("pay")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="heading-2">
                {t("historyTitle", { count: history.length })}
              </h2>
              {history.map((payment) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))}
            </section>
          )}
        </div>
      )}

      <Dialog open={selected !== null} onClose={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("payNow")}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="mt-4">
              <PaymentForm
                payment={selected}
                isSubmitting={isPaying}
                onSubmit={(data: UpdatePaymentInput) => {
                  updateMyPayment(
                    { id: selected.id, data },
                    { onSuccess: () => setSelected(null) },
                  );
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}