"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CreditCard, Pencil, Trash2 } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { StatusBadge } from "@/components/business/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const DataTable = dynamic(
  () => import("@/components/data/DataTable").then((mod) => mod.DataTable),
  { loading: () => <Skeleton variant="table" /> },
) as <T extends object>(props: DataTableProps<T>) => React.JSX.Element;

const PaymentFormModal = dynamic(
  () => import("@/components/business/PaymentFormModal").then((mod) => mod.PaymentFormModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import {
  usePaymentsAdmin,
  useUpdatePayment,
  useDeletePayment,
} from "@/features/payments";
import { getPaymentsAdmin } from "@/features/payments/api/payments-admin";
import { usePrefetchAdminPage } from "@/hooks/usePrefetchAdminPage";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { PAGINATION_DEFAULTS } from "@/config";
import type { PaymentReadModel } from "@/types/models/payment";
import type { UpdatePaymentInput } from "@/schemas/payment";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState<number>(PAGINATION_DEFAULTS.page);
  const { data, isPending, isError, refetch } = usePaymentsAdmin({
    page,
    limit: PAGINATION_DEFAULTS.limit,
  });
  const { mutate: updatePayment, isPending: isUpdating } = useUpdatePayment();
  const { mutate: deletePayment, isPending: isDeleting } = useDeletePayment();

  const [editing, setEditing] = useState<PaymentReadModel | null>(null);
  const [deleting, setDeleting] = useState<PaymentReadModel | null>(null);

  const payments = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const prefetchPage = usePrefetchAdminPage({
    queryKey: queryKeys.payments.admin,
    queryFn: getPaymentsAdmin,
    params: { page, limit: PAGINATION_DEFAULTS.limit },
    page,
    totalPages,
  });

  const columns: Column<PaymentReadModel>[] = useMemo(() => [
    {
      key: "patientId",
      header: "Patient",
      render: (payment) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar
            src={payment.patient.avatarUrl}
            fallback={payment.patient.fullName}
            className="size-8 shrink-0"
            width={32}
            height={32}
          />
          <span className="truncate font-medium">{payment.patient.fullName}</span>
        </div>
      ),
    },
    {
      key: "appointmentId",
      header: "Appointment",
      render: (payment) => (
        <div>
          <span className="block truncate font-medium">{payment.doctor.displayName}</span>
          <span className="block whitespace-nowrap text-xs text-muted-foreground">
            {formatDateTime(payment.slot.date, payment.slot.startTime)}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (payment) => formatCurrency(payment.amount),
    },
    {
      key: "method",
      header: "Method",
      render: (payment) => {
        const label = payment.method.replace(/_/g, " ");
        return <span className="capitalize">{label}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (payment) => <StatusBadge status={payment.status} />,
    },
    {
      key: "transactionReference",
      header: "Reference",
      render: (payment) =>
        payment.transactionReference ?? (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (payment) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing(payment)}
            aria-label={`Edit payment for ${payment.doctor.displayName}`}
            title={`Edit payment for ${payment.doctor.displayName}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleting(payment)}
            aria-label={`Delete payment for ${payment.doctor.displayName}`}
            title={`Delete payment for ${payment.doctor.displayName}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments</h1>
        <p className="text-lg text-muted-foreground">
          Review payments and update their status.
        </p>
      </header>

      {isError ? (
        <ErrorBanner message="Could not load payments." onRetry={refetch} />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:hidden">
            {isPending ? (
              <>
                <Skeleton variant="card" />
                <Skeleton variant="card" />
                <Skeleton variant="card" />
              </>
            ) : payments.length === 0 ? (
              <div className="rounded-xl border border-border">
                <EmptyState
                  icon={<CreditCard className="size-12" />}
                  title="No payments yet"
                  description="Payments made for appointments will appear here."
                />
              </div>
            ) : (
              payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar
                          src={payment.patient.avatarUrl}
                          fallback={payment.patient.fullName}
                          className="size-10 shrink-0"
                          width={40}
                          height={40}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {payment.patient.fullName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {payment.doctor.displayName}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setEditing(payment)}
                          aria-label={`Edit payment for ${payment.doctor.displayName}`}
                          title={`Edit payment for ${payment.doctor.displayName}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleting(payment)}
                          aria-label={`Delete payment for ${payment.doctor.displayName}`}
                          title={`Delete payment for ${payment.doctor.displayName}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={payment.status} />
                      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                        {payment.method.replace(/_/g, " ")}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Amount</dt>
                        <dd className="text-foreground">{formatCurrency(payment.amount)}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Date</dt>
                        <dd className="whitespace-nowrap text-foreground">
                          {formatDateTime(payment.slot.date, payment.slot.startTime)}
                        </dd>
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <dt className="text-muted-foreground">Reference</dt>
                        <dd className="truncate text-foreground">
                          {payment.transactionReference ?? "—"}
                        </dd>
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
              data={payments}
              loading={isPending}
              sortable
              emptyState={
                <EmptyState
                  icon={<CreditCard className="size-12" />}
                  title="No payments yet"
                  description="Payments made for appointments will appear here."
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
        <PaymentFormModal
          open
          onClose={() => setEditing(null)}
          payment={editing}
          isSubmitting={isUpdating}
          onSubmit={(data: UpdatePaymentInput) => {
            updatePayment(
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
            deletePayment(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title="Delete payment"
          message={`Delete payment for ${deleting.doctor.displayName}? This cannot be undone.`}
          confirmLabel="Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
