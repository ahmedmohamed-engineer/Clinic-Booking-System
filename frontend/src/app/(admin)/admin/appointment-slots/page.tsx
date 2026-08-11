"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CalendarRange, Pencil, Plus, Trash2 } from "lucide-react";
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

const SlotFormModal = dynamic(
  () => import("@/components/business/SlotFormModal").then((mod) => mod.SlotFormModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import {
  useSlotsAdmin,
  useCreateSlot,
  useUpdateSlot,
  useDeleteSlot,
} from "@/features/slots";
import { getSlotsAdmin } from "@/features/slots/api/slots-admin";
import { useDoctorsList } from "@/features/doctors";
import { useSchedulesAdmin } from "@/features/schedules";
import { usePrefetchAdminPage } from "@/hooks/usePrefetchAdminPage";
import { formatDate, formatTime } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { PAGINATION_DEFAULTS } from "@/config";
import type { AppointmentSlotReadModel } from "@/types/models/slot";
import type {
  CreateAppointmentSlotInput,
  UpdateAppointmentSlotInput,
} from "@/schemas/slot";

export default function AdminAppointmentSlotsPage() {
  const [page, setPage] = useState<number>(PAGINATION_DEFAULTS.page);
  const { data, isPending, isError, refetch } = useSlotsAdmin({
    page,
    limit: PAGINATION_DEFAULTS.limit,
  });
  const { data: doctors } = useDoctorsList();
  const { data: schedulesData } = useSchedulesAdmin({ page: 1, limit: 100 });

  const { mutate: createSlot, isPending: isCreating } = useCreateSlot();
  const { mutate: updateSlot, isPending: isUpdating } = useUpdateSlot();
  const { mutate: deleteSlot, isPending: isDeleting } = useDeleteSlot();

  const [editing, setEditing] = useState<AppointmentSlotReadModel | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AppointmentSlotReadModel | null>(null);

  const slots = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const schedules = schedulesData?.data ?? [];

  const prefetchPage = usePrefetchAdminPage({
    queryKey: queryKeys.slots.admin,
    queryFn: getSlotsAdmin,
    params: { page, limit: PAGINATION_DEFAULTS.limit },
    page,
    totalPages,
  });

  const columns: Column<AppointmentSlotReadModel>[] = useMemo(() => [
    {
      key: "doctorId",
      header: "Doctor",
      render: (slot) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar
            src={slot.doctor.avatarUrl}
            fallback={slot.doctor.displayName}
            className="size-8 shrink-0"
            width={32}
            height={32}
          />
          <span className="truncate font-medium">{slot.doctor.displayName}</span>
        </div>
      ),
    },
    {
      key: "clinicId",
      header: "Clinic",
      render: (slot) => (
        <span className="block max-w-[12rem] truncate" title={slot.doctor.clinicName}>
          {slot.doctor.clinicName}
        </span>
      ),
    },
    {
      key: "specialtyId",
      header: "Specialty",
      render: (slot) => (
        <span className="block max-w-[10rem] truncate" title={slot.doctor.specialtyName}>
          {slot.doctor.specialtyName}
        </span>
      ),
    },
    {
      key: "slotDate",
      header: "Date",
      sortable: true,
      render: (slot) => formatDate(slot.slotDate),
    },
    {
      key: "startTime",
      header: "Time",
      render: (slot) => `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`,
    },
    {
      key: "status",
      header: "Status",
      render: (slot) => <StatusBadge status={slot.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (slot) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing(slot)}
            aria-label={`Edit slot for ${slot.doctor.displayName} on ${formatDate(slot.slotDate)}`}
            title={`Edit slot for ${slot.doctor.displayName} on ${formatDate(slot.slotDate)}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleting(slot)}
            aria-label={`Delete slot for ${slot.doctor.displayName} on ${formatDate(slot.slotDate)}`}
            title={`Delete slot for ${slot.doctor.displayName} on ${formatDate(slot.slotDate)}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Appointment Slots
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage bookable appointment slots.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Add slot
        </Button>
      </header>

      {isError ? (
        <ErrorBanner message="Could not load appointment slots." onRetry={refetch} />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:hidden">
            {isPending ? (
              <>
                <Skeleton variant="card" />
                <Skeleton variant="card" />
                <Skeleton variant="card" />
              </>
            ) : slots.length === 0 ? (
              <div className="rounded-xl border border-border">
                <EmptyState
                  icon={<CalendarRange className="size-12" />}
                  title="No slots yet"
                  description="Create appointment slots for doctors to fill their schedule."
                />
              </div>
            ) : (
              slots.map((slot) => (
                <Card key={slot.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar
                          src={slot.doctor.avatarUrl}
                          fallback={slot.doctor.displayName}
                          className="size-10 shrink-0"
                          width={40}
                          height={40}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {slot.doctor.displayName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {slot.doctor.clinicName}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setEditing(slot)}
                          aria-label={`Edit slot for ${slot.doctor.displayName} on ${formatDate(slot.slotDate)}`}
                          title={`Edit slot for ${slot.doctor.displayName} on ${formatDate(slot.slotDate)}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleting(slot)}
                          aria-label={`Delete slot for ${slot.doctor.displayName} on ${formatDate(slot.slotDate)}`}
                          title={`Delete slot for ${slot.doctor.displayName} on ${formatDate(slot.slotDate)}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={slot.status} />
                      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {slot.doctor.specialtyName}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Date</dt>
                        <dd className="whitespace-nowrap text-foreground">
                          {formatDate(slot.slotDate)}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Time</dt>
                        <dd className="whitespace-nowrap text-foreground">
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
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
              data={slots}
              loading={isPending}
              sortable
              emptyState={
                <EmptyState
                  icon={<CalendarRange className="size-12" />}
                  title="No slots yet"
                  description="Create appointment slots for doctors to fill their schedule."
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

      {creating && (
        <SlotFormModal
          open
          onClose={() => setCreating(false)}
          doctors={doctors ?? []}
          schedules={schedules}
          isSubmitting={isCreating}
          onSubmit={(data) => {
            createSlot(data as CreateAppointmentSlotInput, {
              onSuccess: () => setCreating(false),
            });
          }}
        />
      )}

      {editing && (
        <SlotFormModal
          open
          onClose={() => setEditing(null)}
          slot={editing}
          doctors={doctors ?? []}
          schedules={schedules}
          isSubmitting={isUpdating}
          onSubmit={(data) => {
            updateSlot(
              { id: editing.id, data: data as UpdateAppointmentSlotInput },
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
            deleteSlot(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title="Delete slot"
          message={`Delete the appointment slot on ${formatDate(deleting.slotDate)}? The slot will be soft-deleted.`}
          confirmLabel="Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
