"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const DataTable = dynamic(
  () => import("@/components/data/DataTable").then((mod) => mod.DataTable),
  { loading: () => <Skeleton variant="table" /> },
) as <T extends object>(props: DataTableProps<T>) => React.JSX.Element;

const DoctorFormModal = dynamic(
  () => import("@/components/business/DoctorFormModal").then((mod) => mod.DoctorFormModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import {
  useDoctorsList,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
} from "@/features/doctors";
import { useClinicsList } from "@/features/clinics";
import { useSpecialtiesList } from "@/features/specialties";
import { useUsersAdmin } from "@/features/users";
import { formatCurrency } from "@/lib/utils";
import type { DoctorReadModel } from "@/types/models/doctor";
import type { CreateDoctorInput, UpdateDoctorInput } from "@/schemas/doctor";

export default function AdminDoctorsPage() {
  const {
    data: doctors,
    isPending,
    isError,
    refetch,
  } = useDoctorsList();
  const { data: clinics } = useClinicsList();
  const { data: specialties } = useSpecialtiesList();
  const { data: doctorUsers } = useUsersAdmin({ role: "doctor", limit: 100 });

  const { mutateAsync: createDoctor, isPending: isCreating } = useCreateDoctor();
  const { mutateAsync: updateDoctor, isPending: isUpdating } = useUpdateDoctor();
  const { mutate: deleteDoctor, isPending: isDeleting } = useDeleteDoctor();

  const [editing, setEditing] = useState<DoctorReadModel | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DoctorReadModel | null>(null);

  const users = useMemo(() => doctorUsers?.data ?? [], [doctorUsers]);

  const columns: Column<DoctorReadModel>[] = useMemo(() => [
    {
      key: "userId",
      header: "User",
      render: (doctor) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            src={doctor.doctor.avatarUrl}
            fallback={doctor.doctor.displayName}
            className="size-8"
            width={32}
            height={32}
          />
          <span className="truncate">{doctor.doctor.displayName}</span>
        </div>
      ),
    },
    {
      key: "clinicId",
      header: "Clinic",
      render: (doctor) => doctor.doctor.clinicName,
    },
    {
      key: "specialtyId",
      header: "Specialty",
      render: (doctor) => doctor.doctor.specialtyName,
    },
    {
      key: "consultationFee",
      header: "Fee",
      render: (doctor) => formatCurrency(Number(doctor.consultationFee)),
    },
    {
      key: "experienceYears",
      header: "Experience",
      render: (doctor) => `${doctor.experienceYears} yrs`,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (doctor) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setEditing(doctor)}
            aria-label={`Edit doctor ${doctor.doctor.displayName}`}
            title={`Edit doctor ${doctor.doctor.displayName}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setDeleting(doctor)}
            aria-label={`Delete doctor ${doctor.doctor.displayName}`}
            title={`Delete doctor ${doctor.doctor.displayName}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  if (isError) {
    return <ErrorBanner message="Could not load doctors." onRetry={refetch} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Doctors</h1>
          <p className="text-lg text-muted-foreground">
            Manage doctor profiles, clinics, and consultation fees.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Add doctor
        </Button>
      </header>

      {isPending ? (
        <div className="flex flex-col gap-4">
          <Skeleton variant="table" />
          <Skeleton variant="table" />
          <Skeleton variant="table" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={doctors ?? []}
          sortable
          emptyState={
            <EmptyState
              icon={<UserRound className="size-12" />}
              title="No doctors yet"
              description="Add a doctor to start scheduling appointments."
            />
          }
        />
      )}

      {creating && (
        <DoctorFormModal
          open
          onClose={() => setCreating(false)}
          users={users}
          clinics={clinics ?? []}
          specialties={specialties ?? []}
          isSubmitting={isCreating}
          onSubmit={async (data) => {
            await createDoctor(data as CreateDoctorInput);
            setCreating(false);
          }}
        />
      )}

      {editing && (
        <DoctorFormModal
          open
          onClose={() => setEditing(null)}
          doctor={editing}
          users={users}
          clinics={clinics ?? []}
          specialties={specialties ?? []}
          isSubmitting={isUpdating}
          onSubmit={async (data) => {
            await updateDoctor({ id: editing.id, data: data as UpdateDoctorInput });
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            deleteDoctor(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title="Delete doctor"
          message={`Delete doctor ${deleting.doctor.displayName}? Schedules and slots for this doctor will also be deleted.`}
          confirmLabel="Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
