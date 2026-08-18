"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DataTable = dynamic(
  () => import("@/components/data/DataTable").then((mod) => mod.DataTable),
  { loading: () => <Skeleton variant="table" /> },
) as <T extends object>(props: DataTableProps<T>) => React.JSX.Element;

const SpecialtyFormModal = dynamic(
  () => import("@/components/business/SpecialtyFormModal").then((mod) => mod.SpecialtyFormModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import { useSpecialtiesList } from "@/features/specialties";
import {
  useCreateSpecialty,
  useUpdateSpecialty,
  useDeleteSpecialty,
} from "@/features/specialties";
import type { SpecialtyRecord } from "@/types/models/specialty";
import type { CreateSpecialtyInput, UpdateSpecialtyInput } from "@/schemas/specialty";

export default function AdminSpecialtiesPage() {
  const t = useTranslations("adminSpecialties");
  const ts = useTranslations("adminShared");
  const {
    data: specialties,
    isPending,
    isError,
    refetch,
  } = useSpecialtiesList();
  const { mutate: createSpecialty, isPending: isCreating } = useCreateSpecialty();
  const { mutate: updateSpecialty, isPending: isUpdating } = useUpdateSpecialty();
  const { mutate: deleteSpecialty, isPending: isDeleting } = useDeleteSpecialty();

  const [editing, setEditing] = useState<SpecialtyRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<SpecialtyRecord | null>(null);

  const columns: Column<SpecialtyRecord>[] = useMemo(() => [
    { key: "name", header: ts("name"), sortable: true },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (specialty) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing(specialty)}
            aria-label={ts("editName", { name: specialty.name })}
            title={ts("editName", { name: specialty.name })}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleting(specialty)}
            aria-label={ts("deleteName", { name: specialty.name })}
            title={ts("deleteName", { name: specialty.name })}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [ts]);

  return (
    <div className="flex flex-col gap-6">
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
            ) : (specialties ?? []).length === 0 ? (
              <div className="rounded-xl border border-border">
                <EmptyState
                  icon={<Stethoscope className="size-12" />}
                  title={t("emptyTitle")}
                  description={t("emptyDesc")}
                />
              </div>
            ) : (
              (specialties ?? []).map((specialty) => (
                <Card key={specialty.id}>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Stethoscope className="size-5" />
                      </div>
                      <p className="truncate text-sm font-medium text-foreground">
                        {specialty.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setEditing(specialty)}
                        aria-label={ts("editName", { name: specialty.name })}
                        title={ts("editName", { name: specialty.name })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setDeleting(specialty)}
                        aria-label={ts("deleteName", { name: specialty.name })}
                        title={ts("deleteName", { name: specialty.name })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={specialties ?? []}
              loading={isPending}
              sortable
              emptyState={
                <EmptyState
                  icon={<Stethoscope className="size-12" />}
                  title={t("emptyTitle")}
                  description={t("emptyDesc")}
                />
              }
            />
          </div>
        </>
      )}

      {creating && (
        <SpecialtyFormModal
          open
          onClose={() => setCreating(false)}
          isSubmitting={isCreating}
          onSubmit={(data) => {
            createSpecialty(data as CreateSpecialtyInput, { onSuccess: () => setCreating(false) });
          }}
        />
      )}

      {editing && (
        <SpecialtyFormModal
          open
          onClose={() => setEditing(null)}
          specialty={editing}
          isSubmitting={isUpdating}
          onSubmit={(data) => {
            updateSpecialty(
              { id: editing.id, data: data as UpdateSpecialtyInput },
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
            deleteSpecialty(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title={t("deleteTitle")}
          message={t("deleteMessage", { name: deleting.name })}
          confirmLabel={ts("delete")}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
