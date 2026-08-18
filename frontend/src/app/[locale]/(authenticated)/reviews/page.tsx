"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
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
  const t = useTranslations("reviewsPage");
  const locale = useLocale();
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
        <ErrorBanner message={t("error")} onRetry={refetch} />
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
    <div className="container-custom flex flex-col gap-8 p-6">
      <header className="animate-fade-in flex flex-col gap-2">
        <h1 className="heading-1">{t("title")}</h1>
        <p className="body-text">
          {t("patientSubtitle")}
        </p>
      </header>

      <div className="animate-fade-in flex flex-col gap-6">
      {eligibleForReview.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="heading-2">
            {t("writeSection", { count: eligibleForReview.length })}
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
                  {formatDateTime(appointment.slot.date, appointment.slot.startTime, locale)}
                </p>
              </div>
              <Button
                className="w-full sm:w-auto"
                onClick={() => setSelected(appointment)}
              >
                <Star />
                {t("leaveReview")}
              </Button>
            </div>
          ))}
        </section>
      )}

      {reviewedAppointments.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="heading-2">
            {t("yoursSection", { count: reviewedAppointments.length })}
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
                    {formatDateTime(appointment.slot.date, appointment.slot.startTime, locale)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setViewing(review ?? null)}
                >
                  <Star />
                  {t("viewReview")}
                </Button>
              </div>
            );
          })}
        </section>
      )}

      <Dialog open={selected !== null} onClose={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("writeTitle")}</DialogTitle>
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
            <DialogTitle>{t("yoursTitle")}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="mt-4">
              <ReviewCard review={viewing} />
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function DoctorReviewsContent() {
  const t = useTranslations("reviewsPage");
  const { data: reviews, isPending, isError, refetch } = useMyReviews();

  if (isError) {
    return (
      <div className="p-6">
        <ErrorBanner message={t("error")} onRetry={refetch} />
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
    <div className="container-custom flex flex-col gap-8 p-6">
      <header className="animate-fade-in flex flex-col gap-2">
        <h1 className="heading-1">{t("title")}</h1>
        <p className="body-text">
          {t("doctorSubtitle")}
        </p>
      </header>

      <div className="animate-fade-in">
      <section className="flex flex-col gap-3">
        {reviews?.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={<Star className="size-12" />}
              title={t("emptyTitle")}
              description={t("emptyDesc")}
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