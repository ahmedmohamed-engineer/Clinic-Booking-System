"use client";

import Link from "next/link";
import { CreditCard, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/business/StatusBadge";
import { ConfirmDialog } from "@/components/business/ConfirmDialog";
import { useState, memo } from "react";
import { formatDateTime } from "@/lib/utils";
import type { AppointmentReadModel } from "@/types/models/appointment";
import type { UserRole } from "@/types/enums";

interface AppointmentCardProps {
  appointment: AppointmentReadModel;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
  viewer?: UserRole;
}

const CANCELLABLE_STATUSES = new Set(["scheduled", "confirmed"]);

export const AppointmentCard = memo(function AppointmentCard({
  appointment,
  onCancel,
  isCancelling,
  viewer = "patient",
}: AppointmentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancellable =
    onCancel && CANCELLABLE_STATUSES.has(appointment.status);

  const isCompleted = appointment.status === "completed";
  const needsPayment =
    isCompleted &&
    viewer === "patient" &&
    (appointment.paymentStatus === null ||
      appointment.paymentStatus === "pending" ||
      appointment.paymentStatus === "failed");
  const canLeaveReview =
    isCompleted &&
    viewer === "patient" &&
    appointment.paymentStatus === "paid" &&
    !appointment.reviewExists;
  const canViewReview =
    isCompleted &&
    viewer === "patient" &&
    appointment.paymentStatus === "paid" &&
    appointment.reviewExists;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar
          src={
            viewer === "doctor"
              ? appointment.patient.avatarUrl
              : appointment.doctor.avatarUrl
          }
          fallback={
            viewer === "doctor"
              ? appointment.patient.fullName
              : appointment.doctor.displayName
          }
          className="size-10 shrink-0"
          width={40}
          height={40}
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">
            {viewer === "doctor"
              ? appointment.patient.fullName
              : appointment.doctor.displayName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {appointment.doctor.specialtyName}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {appointment.doctor.clinicName}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:items-end sm:justify-between">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-foreground">
            {formatDateTime(appointment.slot.date, appointment.slot.startTime)}
          </p>
          <StatusBadge status={appointment.status} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {cancellable && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setConfirmOpen(true)}
              disabled={isCancelling}
            >
              <X className="size-3.5" />
              Cancel
            </Button>
          )}
          {needsPayment && (
            <Link href="/payments" className="inline-flex w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto">
                <CreditCard className="size-3.5" />
                Pay
              </Button>
            </Link>
          )}
          {(canLeaveReview || canViewReview) && (
            <Link href="/reviews" className="inline-flex w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Star className="size-3.5" />
                {canLeaveReview ? "Leave Review" : "View Review"}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (onCancel) onCancel(appointment.id);
          setConfirmOpen(false);
        }}
        title="Cancel appointment?"
        message="This appointment will be cancelled and can no longer be attended."
        confirmLabel="Cancel appointment"
        isLoading={isCancelling}
      />
    </div>
  );
});
