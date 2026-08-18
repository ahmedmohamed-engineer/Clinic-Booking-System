"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Star, Trash2 } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { StarRating } from "@/components/business/StarRating";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

const DataTable = dynamic(
  () => import("@/components/data/DataTable").then((mod) => mod.DataTable),
  { loading: () => <Skeleton variant="table" /> },
) as <T extends object>(props: DataTableProps<T>) => React.JSX.Element;

const ReviewDetailModal = dynamic(
  () => import("@/components/business/ReviewDetailModal").then((mod) => mod.ReviewDetailModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import {
  useReviewsAdmin,
  useUpdateReview,
  useDeleteReview,
} from "@/features/reviews";
import { getReviewsAdmin } from "@/features/reviews/api/reviews-admin";
import { usePrefetchAdminPage } from "@/hooks/usePrefetchAdminPage";
import { queryKeys } from "@/lib/query-keys";
import { PAGINATION_DEFAULTS } from "@/config";
import type { ReviewReadModel } from "@/types/models/review";
import type { UpdateReviewInput } from "@/schemas/review";

const truncate = (value: string, length = 40) =>
  value.length > length ? `${value.slice(0, length)}…` : value;

export default function AdminReviewsPage() {
  const t = useTranslations("adminReviews");
  const ts = useTranslations("adminShared");
  const locale = useLocale();
  const [page, setPage] = useState<number>(PAGINATION_DEFAULTS.page);
  const { data, isPending, isError, refetch } = useReviewsAdmin({
    page,
    limit: PAGINATION_DEFAULTS.limit,
  });
  const { mutate: updateReview, isPending: isUpdating } = useUpdateReview();
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteReview();

  const [editing, setEditing] = useState<ReviewReadModel | null>(null);
  const [deleting, setDeleting] = useState<ReviewReadModel | null>(null);

  const reviews = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const prefetchPage = usePrefetchAdminPage({
    queryKey: queryKeys.reviews.admin,
    queryFn: getReviewsAdmin,
    params: { page, limit: PAGINATION_DEFAULTS.limit },
    page,
    totalPages,
  });

  const columns: Column<ReviewReadModel>[] = useMemo(() => [
    {
      key: "patientId",
      header: ts("patient"),
      render: (review) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar
            src={review.patient.avatarUrl}
            fallback={review.patient.fullName}
            className="size-8 shrink-0"
            width={32}
            height={32}
          />
          <span className="truncate font-medium">{review.patient.fullName}</span>
        </div>
      ),
    },
    {
      key: "appointmentId",
      header: ts("appointment"),
      render: (review) => (
        <div>
          <span className="block truncate font-medium">{review.doctor.displayName}</span>
          <span className="block whitespace-nowrap text-xs text-muted-foreground">
            {formatDateTime(review.slot.date, review.slot.startTime, locale)}
          </span>
        </div>
      ),
    },
    {
      key: "rating",
      header: ts("rating"),
      render: (review) => <StarRating rating={review.rating} readonly size="sm" />,
    },
    {
      key: "comment",
      header: ts("comment"),
      render: (review) =>
        review.comment ? (
          <span className="text-muted-foreground">{truncate(review.comment)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (review) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing(review)}
            aria-label={t("editAria", { name: review.doctor.displayName })}
            title={t("editAria", { name: review.doctor.displayName })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleting(review)}
            aria-label={t("deleteAria", { name: review.doctor.displayName })}
            title={t("deleteAria", { name: review.doctor.displayName })}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [ts, t, locale]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      {isError ? (
        <ErrorBanner message={t("error")} onRetry={refetch} />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:hidden">
            {isPending ? (
              <>
                <Skeleton variant="card" />
                <Skeleton variant="card" />
                <Skeleton variant="card" />
              </>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl border border-border">
                <EmptyState
                  icon={<Star className="size-12" />}
                  title={t("emptyTitle")}
                  description={t("emptyDesc")}
                />
              </div>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar
                          src={review.patient.avatarUrl}
                          fallback={review.patient.fullName}
                          className="size-10 shrink-0"
                          width={40}
                          height={40}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {review.patient.fullName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {review.doctor.displayName}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setEditing(review)}
                          aria-label={t("editAria", { name: review.doctor.displayName })}
                          title={t("editAria", { name: review.doctor.displayName })}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleting(review)}
                          aria-label={t("deleteAria", { name: review.doctor.displayName })}
                          title={t("deleteAria", { name: review.doctor.displayName })}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <StarRating rating={review.rating} readonly size="sm" />
                    {review.comment ? (
                      <p className="line-clamp-3 text-xs text-muted-foreground">{review.comment}</p>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("noComment")}</span>
                    )}
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">{ts("date")}</dt>
                        <dd className="whitespace-nowrap text-foreground">
                          {formatDateTime(review.slot.date, review.slot.startTime, locale)}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">{ts("rating")}</dt>
                        <dd className="text-foreground">{t("ratingOf", { rating: review.rating })}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={reviews}
              loading={isPending}
              sortable
              emptyState={
                <EmptyState
                  icon={<Star className="size-12" />}
                  title={t("emptyTitle")}
                  description={t("emptyDesc")}
                />
              }
            />
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onPagePrefetch={prefetchPage}
          />
        </>
      )}

      {editing && (
        <ReviewDetailModal
          open
          onClose={() => setEditing(null)}
          review={editing}
          isSubmitting={isUpdating}
          onSubmit={(data: UpdateReviewInput) => {
            updateReview(
              { id: editing.id, data },
              { onSuccess: () => setEditing(null) },
            );
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            deleteReview(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title={t("deleteTitle")}
          message={t("deleteMessage")}
          confirmLabel={ts("delete")}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
