"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
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

export default function DoctorSchedulePage() {
  const t = useTranslations("schedulePage");
  const td = useTranslations("weekdays");
  const locale = useLocale();
  const { data: schedules, isPending, isError, refetch } = useMySchedule();
  const { mutate: createSchedule, isPending: isCreating } = useCreateMySchedule();
  const { mutate: updateSchedule, isPending: isUpdating } = useUpdateMySchedule();
  const { mutate: deleteSchedule, isPending: isDeleting } = useDeleteMySchedule();

  const [editing, setEditing] = useState<DoctorScheduleReadModel | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DoctorScheduleReadModel | null>(null);

  const scheduleList = schedules ?? [];

  const dayLabels = useMemo(
    () => [
      td("sunday"),
      td("monday"),
      td("tuesday"),
      td("wednesday"),
      td("thursday"),
      td("friday"),
      td("saturday"),
    ],
    [td],
  );

  const columns: Column<DoctorScheduleReadModel>[] = useMemo(() => [
    {
      key: "weekday",
      header: t("day"),
      render: (schedule) => dayLabels[schedule.weekday],
    },
    {
      key: "startTime",
      header: t("start"),
      render: (schedule) => formatTime(schedule.startTime, locale),
    },
    {
      key: "endTime",
      header: t("end"),
      render: (schedule) => formatTime(schedule.endTime, locale),
    },
    {
      key: "slotDuration",
      header: t("slotDuration"),
      render: (schedule) =>
        t("slotDurationValue", { minutes: schedule.slotDuration }),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (schedule) => {
        const day = dayLabels[schedule.weekday];
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setEditing(schedule)}
              aria-label={t("editScheduleAria", { day })}
              title={t("editScheduleAria", { day })}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setDeleting(schedule)}
              aria-label={t("deleteScheduleAria", { day })}
              title={t("deleteScheduleAria", { day })}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ], [t, dayLabels, locale]);

  if (isError) {
    return <ErrorBanner message={t("error")} onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          {t("add")}
        </Button>
      </header>

      {isPending ? (
        <Skeleton variant="calendar" />
      ) : scheduleList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<CalendarClock className="size-12" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
          />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              {t("weeklyCalendar")}
            </h2>
            <WeeklyCalendar schedules={scheduleList} />
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {scheduleList.map((schedule) => {
              const day = dayLabels[schedule.weekday];
              return (
                <Card key={schedule.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {day}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatTime(schedule.startTime, locale)} – {formatTime(schedule.endTime, locale)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setEditing(schedule)}
                          aria-label={t("editScheduleAria", { day })}
                          title={t("editScheduleAria", { day })}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleting(schedule)}
                          aria-label={t("deleteScheduleAria", { day })}
                          title={t("deleteScheduleAria", { day })}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">{t("start")}</dt>
                        <dd className="text-foreground">{formatTime(schedule.startTime, locale)}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">{t("end")}</dt>
                        <dd className="text-foreground">{formatTime(schedule.endTime, locale)}</dd>
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <dt className="text-muted-foreground">{t("slotDuration")}</dt>
                        <dd className="text-foreground">
                          {t("slotDurationValue", { minutes: schedule.slotDuration })}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={scheduleList}
              sortable
              emptyState={
                <EmptyState
                  icon={<CalendarClock className="size-12" />}
                  title={t("emptyTitle")}
                  description={t("emptyDesc")}
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
          title={t("deleteTitle")}
          message={t("deleteMessage")}
          confirmLabel={t("deleteTitle")}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}