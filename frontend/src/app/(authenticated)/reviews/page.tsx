"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Star } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useMyReviews, useCreateReview } from "@/features/reviews";
import { useMyAppointments } from "@/features/appointments";
import { ReviewCard } from "@/components/business/ReviewCard";
import { Skeleton } from "@/components/feedback/Skeleton";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppointmentRecord } from "@/types/models/appointment";
import type { ReviewReadModel } from "@/types/models/review";
import type { CreateReviewInput } from "@/schemas/review";
import { formatDateTime } from "@/lib/utils";

const ReviewForm = dynamic(
  () => import("@/components/business/ReviewForm").then((mod) => mod.ReviewForm),
  { loading: () => <Skeleton variant="form" /> },
);

function PatientReviewsContent() {
  const { data: reviews, isPending, isError, refetch } = useMyReviews();
  const { data: appointments } = useMyAppointments();
  const { mutate: createReview, isPending: isSubmitting } = useCreateReview();
  const [selected, setSelected] = useState<AppointmentRecord | null>(null);
  const [viewing, setViewing] = useState<ReviewReadModel | null>(null);

  const reviewedByAppointment = useMemo(
    () =>
      new Map(
        (reviews ?? []).map((review) => [review.appointmentId, review] as const),
      ),
    [reviews],
  );

  const eligibleForReview = useMemo(
    () =>
      appointments?.filter(
        (appointment) =>
          appointment.status === "completed" &&
          appointment.paymentStatus === "paid" &&
          !reviewedByAppointment.has(appointment.id),
      ) ?? [],
    [appointments, reviewedByAppointment],
  );

  const reviewedAppointments = useMemo(
    () =>
      appointments?.filter(
        (appointment) =>
          appointment.status === "completed" &&
          appointment.paymentStatus === "paid" &&
          reviewedByAppointment.has(appointment.id),
      ) ?? [],
    [appointments, reviewedByAppointment],
  );

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message="Could not load your reviews." onRetry={refetch} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton variant="card" className="h-20" />
        <Skeleton variant="card" className="h-20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Reviews
        </h1>
        <p className="text-lg text-muted-foreground">
          Share your experience after a completed appointment.
        </p>
      </header>

      {eligibleForReview.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">
            Write a Review ({eligibleForReview.length})
          </h2>
          {eligibleForReview.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-outline-variant sm:flex-row sm:items-center sm:justify-between"
            >
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
              <Button onClick={() => setSelected(appointment)}>
                <Star />
                Leave Review
              </Button>
            </div>
          ))}
        </section>
      )}

      {reviewedAppointments.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-foreground">
            Your Reviews ({reviewedAppointments.length})
          </h2>
          {reviewedAppointments.map((appointment) => {
            const review = reviewedByAppointment.get(appointment.id);
            return (
              <div
                key={appointment.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-outline-variant sm:flex-row sm:items-center sm:justify-between"
              >
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
                <Button variant="outline" onClick={() => setViewing(review ?? null)}>
                  <Star />
                  View Review
                </Button>
              </div>
            );
          })}
        </section>
      )}

      <Dialog open={selected !== null} onClose={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="mt-4">
              <ReviewForm
                appointmentId={selected.id}
                isSubmitting={isSubmitting}
                onSubmit={(data: CreateReviewInput) => {
                  createReview(data, {
                    onSuccess: () => setSelected(null),
                  });
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={viewing !== null} onClose={() => setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Review</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="mt-4">
              <ReviewCard review={viewing} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DoctorReviewsContent() {
  const { data: reviews, isPending, isError, refetch } = useMyReviews();

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message="Could not load your reviews." onRetry={refetch} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton variant="card" className="h-20" />
        <Skeleton variant="card" className="h-20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Reviews
        </h1>
        <p className="text-lg text-muted-foreground">
          Reviews left by patients for your appointments.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        {reviews?.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={<Star className="size-12" />}
              title="No reviews yet"
              description="Reviews left by patients for your appointments will appear here."
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews?.map((review) => (
              <ReviewCard key={review.id} review={review} viewer="doctor" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ReviewsPage() {
  const { user } = useAuth();

  return user?.role === "doctor" ? (
    <DoctorReviewsContent />
  ) : (
    <PatientReviewsContent />
  );
}
