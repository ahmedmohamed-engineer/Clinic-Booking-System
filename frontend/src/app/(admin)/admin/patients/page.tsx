"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

const DataTable = dynamic(
  () => import("@/components/data/DataTable").then((mod) => mod.DataTable),
  { loading: () => <Skeleton variant="table" /> },
) as <T extends object>(props: DataTableProps<T>) => React.JSX.Element;

const PatientFormModal = dynamic(
  () => import("@/components/business/PatientFormModal").then((mod) => mod.PatientFormModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import {
  usePatientsAdmin,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from "@/features/patients";
import { getPatientsAdmin } from "@/features/patients/api/patients-admin";
import { useUsersAdmin } from "@/features/users";
import { usePrefetchAdminPage } from "@/hooks/usePrefetchAdminPage";
import { queryKeys } from "@/lib/query-keys";
import { PAGINATION_DEFAULTS } from "@/config";
import type { PatientRecord } from "@/types/models/patient";
import type { CreatePatientInput, UpdatePatientInput } from "@/schemas/patient";

export default function AdminPatientsPage() {
  const [page, setPage] = useState<number>(PAGINATION_DEFAULTS.page);
  const { data, isPending, isError, refetch } = usePatientsAdmin({
    page,
    limit: PAGINATION_DEFAULTS.limit,
  });
  const { data: patientUsers } = useUsersAdmin({ role: "patient", limit: 100 });

  const { mutate: createPatient, isPending: isCreating } = useCreatePatient();
  const { mutate: updatePatient, isPending: isUpdating } = useUpdatePatient();
  const { mutate: deletePatient, isPending: isDeleting } = useDeletePatient();

  const [editing, setEditing] = useState<PatientRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<PatientRecord | null>(null);

  const patients = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const users = patientUsers?.data ?? [];

  const prefetchPage = usePrefetchAdminPage({
    queryKey: queryKeys.patients.all,
    queryFn: getPatientsAdmin,
    params: { page, limit: PAGINATION_DEFAULTS.limit },
    page,
    totalPages,
  });

  const columns: Column<PatientRecord>[] = useMemo(
    () => [

    {
      key: "fullName",
      header: "Full name",
      sortable: true,
      render: (patient) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            src={patient.avatarUrl}
            fallback={patient.fullName}
            className="size-8"
            width={32}
            height={32}
          />
          <span className="truncate">{patient.fullName}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (patient) => patient.phone ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "gender",
      header: "Gender",
      render: (patient) => patient.gender ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "birthDate",
      header: "Date of birth",
      render: (patient) =>
        patient.birthDate ? (
          formatDate(patient.birthDate)
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (patient) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing(patient)}
            aria-label={`Edit ${patient.fullName}`}
            title={`Edit ${patient.fullName}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleting(patient)}
            aria-label={`Delete ${patient.fullName}`}
            title={`Delete ${patient.fullName}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Patients</h1>
          <p className="text-lg text-muted-foreground">
            Manage patient profiles.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Add patient
        </Button>
      </header>

      {isError ? (
        <ErrorBanner message="Could not load patients." onRetry={refetch} />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:hidden">
            {isPending ? (
              <>
                <Skeleton variant="card" />
                <Skeleton variant="card" />
                <Skeleton variant="card" />
              </>
            ) : patients.length === 0 ? (
              <div className="rounded-xl border border-border">
                <EmptyState
                  icon={<ClipboardList className="size-12" />}
                  title="No patients yet"
                  description="Patient profiles will appear here once they register."
                />
              </div>
            ) : (
              patients.map((patient) => (
                <Card key={patient.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar
                          src={patient.avatarUrl}
                          fallback={patient.fullName}
                          className="size-10 shrink-0"
                          width={40}
                          height={40}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {patient.fullName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {patient.gender ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setEditing(patient)}
                          aria-label={`Edit ${patient.fullName}`}
                          title={`Edit ${patient.fullName}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeleting(patient)}
                          aria-label={`Delete ${patient.fullName}`}
                          title={`Delete ${patient.fullName}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd className="truncate text-foreground">{patient.phone ?? "—"}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Date of birth</dt>
                        <dd className="text-foreground">
                          {patient.birthDate ? formatDate(patient.birthDate) : "—"}
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
              data={patients}
              loading={isPending}
              sortable
              emptyState={
                <EmptyState
                  icon={<ClipboardList className="size-12" />}
                  title="No patients yet"
                  description="Patient profiles will appear here once they register."
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
        <PatientFormModal
          open
          onClose={() => setCreating(false)}
          users={users}
          isSubmitting={isCreating}
          onSubmit={(data) => {
            createPatient(data as CreatePatientInput, { onSuccess: () => setCreating(false) });
          }}
        />
      )}

      {editing && (
        <PatientFormModal
          open
          onClose={() => setEditing(null)}
          patient={editing}
          users={users}
          isSubmitting={isUpdating}
          onSubmit={(data) => {
            updatePatient(
              { id: editing.id, data: data as UpdatePatientInput },
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
            deletePatient(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title="Delete patient"
          message={`Delete patient profile for ${deleting.fullName}? This cannot be undone.`}
          confirmLabel="Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
