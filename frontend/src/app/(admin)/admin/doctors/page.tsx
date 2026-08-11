"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { SearchInput } from "@/components/data/SearchInput";
import { FilterDropdown, type FilterOption } from "@/components/data/FilterDropdown";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

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
import type { UserRecord } from "@/types/models/user";
import type { CreateDoctorInput, UpdateDoctorInput } from "@/schemas/doctor";

const pillBase =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";

function StatusBadge({ deletedAt }: { deletedAt: string | null }) {
  return deletedAt ? (
    <span className={`${pillBase} border-status-danger/25 bg-status-danger/10 text-status-danger`}>
      Deleted
    </span>
  ) : (
    <span className={`${pillBase} border-status-success/25 bg-status-success/10 text-status-success`}>
      Active
    </span>
  );
}

function DoctorActions({
  doctor,
  onEdit,
  onDelete,
}: {
  doctor: DoctorReadModel;
  onEdit: (doctor: DoctorReadModel) => void;
  onDelete: (doctor: DoctorReadModel) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onEdit(doctor)}
        aria-label={`Edit doctor ${doctor.doctor.displayName}`}
        title={`Edit doctor ${doctor.doctor.displayName}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onDelete(doctor)}
        aria-label={`Delete doctor ${doctor.doctor.displayName}`}
        title={`Delete doctor ${doctor.doctor.displayName}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

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

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [specialtyId, setSpecialtyId] = useState<string | undefined>(undefined);
  const [clinicId, setClinicId] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<DoctorReadModel | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DoctorReadModel | null>(null);

  const all = useMemo(() => doctors ?? [], [doctors]);
  const doctorUserList = useMemo(() => doctorUsers?.data ?? [], [doctorUsers]);
  const userById = useMemo(() => {
    const map = new Map<string, UserRecord>();
    for (const user of doctorUserList) map.set(user.id, user);
    return map;
  }, [doctorUserList]);

  const specialtyOptions = useMemo<FilterOption[]>(
    () => (specialties ?? []).map((s) => ({ value: s.id, label: s.name })),
    [specialties],
  );

  const clinicOptions = useMemo<FilterOption[]>(
    () => (clinics ?? []).map((c) => ({ value: c.id, label: c.name })),
    [clinics],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return all.filter((doctor) => {
      if (specialtyId && doctor.specialtyId !== specialtyId) return false;
      if (clinicId && doctor.clinicId !== clinicId) return false;
      if (!query) return true;
      return [doctor.doctor.displayName, doctor.doctor.specialtyName, doctor.doctor.clinicName]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [all, search, specialtyId, clinicId]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / limit)), [filtered, limit]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleSpecialtyChange(value: string | undefined) {
    setSpecialtyId(value);
    setPage(1);
  }

  function handleClinicChange(value: string | undefined) {
    setClinicId(value);
    setPage(1);
  }

  function handleLimitChange(value: number) {
    setLimit(value);
    setPage(1);
  }

  const columns: Column<DoctorReadModel>[] = useMemo(
    () => [
      {
        key: "userId",
        header: "Doctor",
        render: (doctor) => (
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar
              src={doctor.doctor.avatarUrl}
              fallback={doctor.doctor.displayName}
              className="size-8 shrink-0"
              width={32}
              height={32}
            />
            <span className="truncate font-medium">{doctor.doctor.displayName}</span>
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        render: (doctor) => {
          const email = userById.get(doctor.userId)?.email;
          return email ? (
            <span className="block max-w-[16rem] truncate" title={email}>{email}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        key: "specialtyId",
        header: "Specialty",
        render: (doctor) => doctor.doctor.specialtyName,
      },
      {
        key: "clinicId",
        header: "Clinic",
        render: (doctor) => (
          <span className="block max-w-[12rem] truncate" title={doctor.doctor.clinicName}>
            {doctor.doctor.clinicName}
          </span>
        ),
      },
      {
        key: "consultationFee",
        header: "Fee",
        sortable: true,
        render: (doctor) => formatCurrency(Number(doctor.consultationFee)),
      },
      {
        key: "experienceYears",
        header: "Experience",
        sortable: true,
        render: (doctor) => `${doctor.experienceYears} yrs`,
      },
      {
        key: "bio",
        header: "Bio",
        render: (doctor) =>
          doctor.bio ? (
            <span className="block max-w-[18rem] truncate text-muted-foreground" title={doctor.bio}>
              {doctor.bio}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        render: (doctor) => <StatusBadge deletedAt={userById.get(doctor.userId)?.deletedAt ?? null} />,
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        render: (doctor) => (
          <div className="flex items-center justify-end">
            <DoctorActions doctor={doctor} onEdit={setEditing} onDelete={setDeleting} />
          </div>
        ),
      },
    ],
    [userById],
  );

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

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Search by doctor, specialty, clinic..."
          />
        </div>
        <FilterDropdown
          options={specialtyOptions}
          value={specialtyId}
          onChange={handleSpecialtyChange}
          label="Specialty"
          placeholder="All specialties"
        />
        <FilterDropdown
          options={clinicOptions}
          value={clinicId}
          onChange={handleClinicChange}
          label="Clinic"
          placeholder="All clinics"
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
              icon={<UserRound className="size-12" />}
              title="No doctors found"
              description="No doctors match the current search and filters."
            />
          </div>
        ) : (
          paginated.map((doctor) => {
            const user = userById.get(doctor.userId);
            return (
              <Card key={doctor.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        src={doctor.doctor.avatarUrl}
                        fallback={doctor.doctor.displayName}
                        className="size-10 shrink-0"
                        width={40}
                        height={40}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {doctor.doctor.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user?.email ?? doctor.doctor.specialtyName}
                        </p>
                      </div>
                    </div>
                    <DoctorActions doctor={doctor} onEdit={setEditing} onDelete={setDeleting} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge deletedAt={user?.deletedAt ?? null} />
                    <span className={`${pillBase} border-border text-muted-foreground`}>
                      {doctor.doctor.specialtyName}
                    </span>
                    <span className={`${pillBase} border-border text-muted-foreground`}>
                      {doctor.doctor.clinicName}
                    </span>
                  </div>
                  {doctor.bio && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{doctor.bio}</p>
                  )}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                    <div className="flex flex-col">
                      <dt className="text-muted-foreground">Fee</dt>
                      <dd className="text-foreground">{formatCurrency(Number(doctor.consultationFee))}</dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-muted-foreground">Experience</dt>
                      <dd className="text-foreground">{doctor.experienceYears} yrs</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            );
          })
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
              icon={<UserRound className="size-12" />}
              title="No doctors found"
              description="No doctors match the current search and filters."
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

      {creating && (
        <DoctorFormModal
          open
          onClose={() => setCreating(false)}
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