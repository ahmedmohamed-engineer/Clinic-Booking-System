"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { SearchInput } from "@/components/data/SearchInput";
import { FilterDropdown, type FilterOption } from "@/components/data/FilterDropdown";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { StatusBadge } from "@/components/business/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { APPOINTMENT_STATUSES, PAYMENT_STATUSES } from "@/types/enums";
import type { AppointmentReadModel } from "@/types/models/appointment";
import type { UpdateAppointmentInput } from "@/schemas/appointment";

const DataTable = dynamic(
  () => import("@/components/data/DataTable").then((mod) => mod.DataTable),
  { loading: () => <Skeleton variant="table" /> },
) as <T extends object>(props: DataTableProps<T>) => React.JSX.Element;

const AppointmentDetailModal = dynamic(
  () => import("@/components/business/AppointmentDetailModal").then((mod) => mod.AppointmentDetailModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import { useAppointmentsAdmin, useUpdateAppointment, useDeleteAppointment } from "@/features/appointments";

const statusOptions: FilterOption[] = APPOINTMENT_STATUSES.map((status) => ({
  value: status,
  label: status.replace(/_/g, " "),
}));

const paymentOptions: FilterOption[] = [
  ...PAYMENT_STATUSES.map((status) => ({ value: status, label: status })),
  { value: "none", label: "No payment" },
];

const pillBase =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";

function ReviewBadge({ hasReview }: { hasReview: boolean }) {
  return hasReview ? (
    <span className={`${pillBase} border-status-success/25 bg-status-success/10 text-status-success`}>
      Reviewed
    </span>
  ) : (
    <span className={`${pillBase} border-status-neutral/25 bg-status-neutral/10 text-status-neutral`}>
      Not reviewed
    </span>
  );
}

function PersonCell({
  name,
  avatarUrl,
  sub,
}: {
  name: string;
  avatarUrl?: string | null;
  sub?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar
        src={avatarUrl}
        fallback={name}
        className="size-8 shrink-0"
        width={32}
        height={32}
      />
      <div className="min-w-0">
        <span className="block truncate font-medium">{name}</span>
        {sub && <span className="block max-w-[10rem] truncate text-xs text-muted-foreground" title={sub}>{sub}</span>}
      </div>
    </div>
  );
}

function AppointmentActions({
  appointment,
  onEdit,
  onDelete,
}: {
  appointment: AppointmentReadModel;
  onEdit: (appointment: AppointmentReadModel) => void;
  onDelete: (appointment: AppointmentReadModel) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onEdit(appointment)}
        aria-label={`Edit appointment for ${appointment.patient.fullName}`}
        title={`Edit appointment for ${appointment.patient.fullName}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onDelete(appointment)}
        aria-label={`Delete appointment for ${appointment.patient.fullName}`}
        title={`Delete appointment for ${appointment.patient.fullName}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export default function AdminAppointmentsPage() {
  const { data, isPending, isError, refetch } = useAppointmentsAdmin({ page: 1, limit: 100 });
  const { mutate: updateAppointment, isPending: isUpdating } = useUpdateAppointment();
  const { mutate: deleteAppointment, isPending: isDeleting } = useDeleteAppointment();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [payment, setPayment] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<AppointmentReadModel | null>(null);
  const [deleting, setDeleting] = useState<AppointmentReadModel | null>(null);

  const all = useMemo(() => data?.data ?? [], [data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return all.filter((appointment) => {
      if (status && appointment.status !== status) return false;
      if (payment === "none" && appointment.paymentStatus !== null) return false;
      if (payment && payment !== "none" && appointment.paymentStatus !== payment) return false;
      if (!query) return true;
      return [
        appointment.patient?.fullName ?? "",
        appointment.doctor?.displayName ?? "",
        appointment.doctor?.clinicName ?? "",
        appointment.doctor?.specialtyName ?? "",
        appointment.notes ?? "",
        appointment.id,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [all, search, status, payment]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / limit)), [filtered, limit]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: string | undefined) {
    setStatus(value);
    setPage(1);
  }

  function handlePaymentChange(value: string | undefined) {
    setPayment(value);
    setPage(1);
  }

  function handleLimitChange(value: number) {
    setLimit(value);
    setPage(1);
  }

  const columns: Column<AppointmentReadModel>[] = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        render: (appointment) => (
          <span className="block font-mono text-xs text-muted-foreground" title={appointment.id}>
            {appointment.id.slice(0, 8)}
          </span>
        ),
      },
      {
        key: "patientId",
        header: "Patient",
        render: (appointment) => (
          <PersonCell
            name={appointment.patient?.fullName || "—"}
            avatarUrl={appointment.patient?.avatarUrl}
          />
        ),
      },
      {
        key: "slotId",
        header: "Doctor",
        render: (appointment) => (
          <PersonCell
            name={appointment.doctor?.displayName || "—"}
            avatarUrl={appointment.doctor?.avatarUrl}
            sub={appointment.doctor?.clinicName}
          />
        ),
      },
      {
        key: "specialty",
        header: "Specialty",
        render: (appointment) => (
          <span className="block max-w-[10rem] truncate" title={appointment.doctor.specialtyName}>
            {appointment.doctor.specialtyName}
          </span>
        ),
      },
      {
        key: "fee",
        header: "Fee",
        render: (appointment) =>
          appointment.doctor.consultationFee ? formatCurrency(Number(appointment.doctor.consultationFee)) : <span className="text-muted-foreground">—</span>,
      },
      {
        key: "date",
        header: "Date & time",
        render: (appointment) => (
          <div>
            <span className="block whitespace-nowrap">{formatDate(appointment.slot.date)}</span>
            <span className="block whitespace-nowrap text-xs text-muted-foreground">
              {formatTime(appointment.slot.startTime)} – {formatTime(appointment.slot.endTime)}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (appointment) => <StatusBadge status={appointment.status} />,
      },
      {
        key: "paymentStatus",
        header: "Payment",
        sortable: true,
        render: (appointment) =>
          appointment.paymentStatus ? <StatusBadge status={appointment.paymentStatus} /> : <span className="text-muted-foreground">—</span>,
      },
      {
        key: "reviewExists",
        header: "Review",
        sortable: true,
        render: (appointment) => <ReviewBadge hasReview={appointment.reviewExists} />,
      },
      {
        key: "notes",
        header: "Notes",
        render: (appointment) =>
          appointment.notes ? (
            <span className="block max-w-[14rem] truncate text-muted-foreground" title={appointment.notes}>
              {appointment.notes}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        render: (appointment) => (
          <div className="flex items-center justify-end">
            <AppointmentActions appointment={appointment} onEdit={setEditing} onDelete={setDeleting} />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Appointments
        </h1>
        <p className="text-lg text-muted-foreground">
          Review and update all appointments across the platform.
        </p>
      </header>

      {isError ? (
        <ErrorBanner message="Could not load appointments." onRetry={refetch} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-xs">
              <SearchInput
                value={search}
                onChange={handleSearch}
                placeholder="Search by patient, doctor, clinic..."
              />
            </div>
            <FilterDropdown
              options={statusOptions}
              value={status}
              onChange={handleStatusChange}
              label="Status"
              placeholder="All statuses"
            />
            <FilterDropdown
              options={paymentOptions}
              value={payment}
              onChange={handlePaymentChange}
              label="Payment"
              placeholder="All payments"
            />
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {isPending ? (
              <>
                <Skeleton variant="card" />
                <Skeleton variant="card" />
                <Skeleton variant="card" />
              </>
            ) : paginated.length === 0 ? (
              <div className="rounded-xl border border-border">
                <EmptyState
                  icon={<Calendar className="size-12" />}
                  title="No appointments found"
                  description="No appointments match the current search and filters."
                />
              </div>
            ) : (
              paginated.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {appointment.patient?.fullName || "—"}
                        </p>
                        <p className="truncate text-sm font-medium text-foreground">
                          {appointment.doctor?.displayName || "—"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {appointment.doctor?.clinicName || "—"}
                        </p>
                      </div>
                      <AppointmentActions appointment={appointment} onEdit={setEditing} onDelete={setDeleting} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={appointment.status} />
                      {appointment.paymentStatus ? (
                        <StatusBadge status={appointment.paymentStatus} />
                      ) : (
                        <span className={`${pillBase} border-border text-muted-foreground`}>No payment</span>
                      )}
                      <ReviewBadge hasReview={appointment.reviewExists} />
                    </div>
                    {appointment.notes && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{appointment.notes}</p>
                    )}
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Date & time</dt>
                        <dd className="whitespace-nowrap text-foreground">
                          {formatDate(appointment.slot.date)} • {formatTime(appointment.slot.startTime)}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Specialty</dt>
                        <dd className="truncate text-foreground">{appointment.doctor.specialtyName}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Fee</dt>
                        <dd className="text-foreground">
                          {appointment.doctor.consultationFee ? formatCurrency(Number(appointment.doctor.consultationFee)) : "—"}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">ID</dt>
                        <dd className="truncate font-mono text-foreground" title={appointment.id}>
                          {appointment.id.slice(0, 8)}
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
              data={paginated}
              loading={isPending}
              sortable
              emptyState={
                <EmptyState
                  icon={<Calendar className="size-12" />}
                  title="No appointments found"
                  description="No appointments match the current search and filters."
                />
              }
            />
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={limit}
            pageSizeOptions={[10, 25, 50]}
            onPageSizeChange={handleLimitChange}
          />
        </>
      )}

      {editing && (
        <AppointmentDetailModal
          open
          onClose={() => setEditing(null)}
          appointment={editing}
          isSubmitting={isUpdating}
          onSubmit={(data: UpdateAppointmentInput) => {
            updateAppointment(
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
            deleteAppointment(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title="Delete appointment"
          message={`Delete appointment for ${deleting.patient.fullName}? Deleting fails if a payment record exists for it.`}
          confirmLabel="Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}