"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/button";

const DataTable = dynamic(
  () => import("@/components/data/DataTable").then((mod) => mod.DataTable),
  { loading: () => <Skeleton variant="table" /> },
) as <T extends object>(props: DataTableProps<T>) => React.JSX.Element;

const WeeklyCalendar = dynamic(
  () => import("@/components/business/WeeklyCalendar").then((mod) => mod.WeeklyCalendar),
  { loading: () => <Skeleton variant="calendar" /> },
);

const ScheduleFormModal = dynamic(
  () => import("@/components/business/ScheduleFormModal").then((mod) => mod.ScheduleFormModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  useSchedulesAdmin,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from "@/features/schedules";
import { useDoctorsList } from "@/features/doctors";
import { formatTime } from "@/lib/utils";
import type { DoctorScheduleReadModel } from "@/types/models/schedule";
import type {
  CreateDoctorScheduleInput,
  UpdateDoctorScheduleInput,
} from "@/schemas/schedule";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminDoctorSchedulesPage() {
  const {
    data: schedulesData,
    isPending,
    isError,
    refetch,
  } = useSchedulesAdmin({ page: 1, limit: 100 });
  const { data: doctors } = useDoctorsList();

  const { mutate: createSchedule, isPending: isCreating } = useCreateSchedule();
  const { mutate: updateSchedule, isPending: isUpdating } = useUpdateSchedule();
  const { mutate: deleteSchedule, isPending: isDeleting } = useDeleteSchedule();

  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [editing, setEditing] = useState<DoctorScheduleReadModel | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DoctorScheduleReadModel | null>(null);

  const schedules = useMemo(() => schedulesData?.data ?? [], [schedulesData]);
  const doctorSchedules = useMemo(
    () =>
      selectedDoctor
        ? schedules.filter((schedule) => schedule.doctorId === selectedDoctor)
        : schedules,
    [schedules, selectedDoctor],
  );

  const columns: Column<DoctorScheduleReadModel>[] = useMemo(() => [
    {
      key: "weekday",
      header: "Day",
      render: (schedule) => DAYS[schedule.weekday],
    },
    {
      key: "startTime",
      header: "Start",
      render: (schedule) => formatTime(schedule.startTime),
    },
    {
      key: "endTime",
      header: "End",
      render: (schedule) => formatTime(schedule.endTime),
    },
    {
      key: "slotDuration",
      header: "Slot duration",
      render: (schedule) => `${schedule.slotDuration} min`,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (schedule) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing(schedule)}
            aria-label={`Edit schedule for ${schedule.doctor.displayName}`}
            title={`Edit schedule for ${schedule.doctor.displayName}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleting(schedule)}
            aria-label={`Delete schedule for ${schedule.doctor.displayName}`}
            title={`Delete schedule for ${schedule.doctor.displayName}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  if (isError) {
    return <ErrorBanner message="Could not load schedules." onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Doctor Schedules
          </h1>
          <p className="text-lg text-muted-foreground">
            Define weekly availability for each doctor.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Add schedule
        </Button>
      </header>

      <div className="w-full max-w-xs space-y-2">
        <Label htmlFor="doctorFilter">Doctor</Label>
        <Select value={selectedDoctor} onValueChange={(value) => setSelectedDoctor(value ?? "")}>
          <SelectTrigger id="doctorFilter" className="w-full">
            <SelectValue placeholder="All doctors" />
          </SelectTrigger>
          <SelectContent>
            {(doctors ?? []).map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                {doctor.doctor.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <Skeleton variant="calendar" />
      ) : schedules.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Clock className="size-12" />}
            title="No schedules yet"
            description="Add a weekly schedule for a doctor to get started."
          />
        </div>
      ) : !selectedDoctor ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Clock className="size-12" />}
            title="Select a doctor"
            description="Choose a doctor above to view their weekly calendar."
            className="py-10"
          />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Weekly calendar
            </h2>
            <WeeklyCalendar schedules={doctorSchedules} />
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {doctorSchedules.length === 0 ? (
              <div className="rounded-xl border border-border">
                <EmptyState
                  icon={<Clock className="size-12" />}
                  title="No schedules for this doctor"
                  description="Add a schedule to define this doctor's availability."
                />
              </div>
            ) : (
              doctorSchedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {DAYS[schedule.weekday]}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setEditing(schedule)}
                          aria-label={`Edit schedule for ${schedule.doctor.displayName}`}
                          title={`Edit schedule for ${schedule.doctor.displayName}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleting(schedule)}
                          aria-label={`Delete schedule for ${schedule.doctor.displayName}`}
                          title={`Delete schedule for ${schedule.doctor.displayName}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Start</dt>
                        <dd className="text-foreground">{formatTime(schedule.startTime)}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">End</dt>
                        <dd className="text-foreground">{formatTime(schedule.endTime)}</dd>
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <dt className="text-muted-foreground">Slot duration</dt>
                        <dd className="text-foreground">{schedule.slotDuration} min</dd>
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
              data={doctorSchedules}
              sortable
              emptyState={
                <EmptyState
                  icon={<Clock className="size-12" />}
                  title="No schedules for this doctor"
                  description="Add a schedule to define this doctor's availability."
                />
              }
            />
          </div>
        </>
      )}

      {creating && (
        <ScheduleFormModal
          open
          onClose={() => setCreating(false)}
          doctors={doctors ?? []}
          isSubmitting={isCreating}
          onSubmit={(data) => {
            createSchedule(data as CreateDoctorScheduleInput, {
              onSuccess: () => setCreating(false),
            });
          }}
        />
      )}

      {editing && (
        <ScheduleFormModal
          open
          onClose={() => setEditing(null)}
          schedule={editing}
          doctors={doctors ?? []}
          isSubmitting={isUpdating}
          onSubmit={(data) => {
            updateSchedule(
              { id: editing.id, data: data as UpdateDoctorScheduleInput },
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
            deleteSchedule(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title="Delete schedule"
          message={`Delete this schedule entry? Any slots created from it will also be deleted.`}
          confirmLabel="Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
