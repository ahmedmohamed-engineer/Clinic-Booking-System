"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CreditCard, Receipt, Wallet } from "lucide-react";
import { useMyAppointments } from "@/features/appointments";
import { useMyPayments, useUpdateMyPayment, useCreatePayment } from "@/features/payments";
import { PaymentCard } from "@/components/business/PaymentCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/feedback/Skeleton";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatDateTime } from "@/lib/utils";
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
  const { data: appointments, isPending, isError, refetch } = useMyAppointments();
  const { data: payments, isPending: isPaymentsPending } = useMyPayments();
  const { mutate: updateMyPayment, isPending: isPaying } = useUpdateMyPayment();
  const { mutate: createPayment, isPending: isCreating } = useCreatePayment();
  const [selected, setSelected] = useState<PaymentRecord | null>(null);

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message="Could not load your payments." onRetry={refetch} />
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
        <h1 className="heading-1">Payments</h1>
        <p className="body-text">
          Complete payments for your visits and track your payment history.
        </p>
      </header>

      {empty ? (
        <div className="animate-fade-in rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Wallet className="size-12 text-primary" />}
            title="Nothing to pay"
            description="Payments for your completed visits will appear here."
          />
        </div>
      ) : (
        <div className="animate-fade-in flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="heading-2">
              Complete payment ({due.length})
            </h2>
            {due.length === 0 ? (
              <div className="rounded-xl border border-border bg-card">
                <EmptyState
                  icon={<CreditCard className="size-12 text-primary" />}
                  title="No payments due"
                  description="You're all caught up. Nothing needs to be paid right now."
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
                          {formatDateTime(appointment.slot.date, appointment.slot.startTime)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end sm:justify-between">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-foreground">
                          {appointment.doctor.consultationFee !== undefined
                            ? new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                              }).format(appointment.doctor.consultationFee)
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
                        {isCreating ? "Preparing..." : "Pay"}
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
                Payment history ({history.length})
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
            <DialogTitle>Pay Now</DialogTitle>
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