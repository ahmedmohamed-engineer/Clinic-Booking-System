"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useMySchedule,
  useCreateMySchedule,
  useUpdateMySchedule,
  useDeleteMySchedule,
} from "@/features/schedules";
import { formatTime } from "@/lib/utils";
import type { DoctorScheduleReadModel } from "@/types/models/schedule";
import type {
  CreateMyDoctorScheduleInput,
  UpdateDoctorScheduleInput,
} from "@/schemas/schedule";

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

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorSchedulePage() {
  const { data: schedules, isPending, isError, refetch } = useMySchedule();
  const { mutate: createSchedule, isPending: isCreating } = useCreateMySchedule();
  const { mutate: updateSchedule, isPending: isUpdating } = useUpdateMySchedule();
  const { mutate: deleteSchedule, isPending: isDeleting } = useDeleteMySchedule();

  const [editing, setEditing] = useState<DoctorScheduleReadModel | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DoctorScheduleReadModel | null>(null);

  const scheduleList = schedules ?? [];

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
            aria-label={`Edit schedule for ${DAYS[schedule.weekday]}`}
            title={`Edit schedule for ${DAYS[schedule.weekday]}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleting(schedule)}
            aria-label={`Delete schedule for ${DAYS[schedule.weekday]}`}
            title={`Delete schedule for ${DAYS[schedule.weekday]}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  if (isError) {
    return <ErrorBanner message="Could not load your schedule." onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Schedule
          </h1>
          <p className="text-lg text-muted-foreground">
            Set your weekly availability so patients can book you.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Add schedule
        </Button>
      </header>

      {isPending ? (
        <Skeleton variant="calendar" />
      ) : scheduleList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<CalendarClock className="size-12" />}
            title="No schedule defined"
            description="Add your weekly availability so patients know when they can book you."
          />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Weekly calendar
            </h2>
            <WeeklyCalendar schedules={scheduleList} />
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {scheduleList.map((schedule) => (
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
                        aria-label={`Edit schedule for ${DAYS[schedule.weekday]}`}
                        title={`Edit schedule for ${DAYS[schedule.weekday]}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setDeleting(schedule)}
                        aria-label={`Delete schedule for ${DAYS[schedule.weekday]}`}
                        title={`Delete schedule for ${DAYS[schedule.weekday]}`}
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
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={scheduleList}
              sortable
              emptyState={
                <EmptyState
                  icon={<CalendarClock className="size-12" />}
                  title="No schedule defined"
                  description="Add your weekly availability so patients know when they can book you."
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
          withDoctorField={false}
          isSubmitting={isCreating}
          onSubmit={(data) => {
            createSchedule(data as CreateMyDoctorScheduleInput, {
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
          withDoctorField={false}
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
          message="Delete this schedule entry? Any slots created from it will also be deleted."
          confirmLabel="Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}