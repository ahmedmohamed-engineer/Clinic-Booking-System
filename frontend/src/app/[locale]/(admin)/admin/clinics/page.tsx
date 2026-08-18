"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Column, DataTableProps } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { SearchInput } from "@/components/data/SearchInput";
import { FilterDropdown, type FilterOption } from "@/components/data/FilterDropdown";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DataTable = dynamic(
  () => import("@/components/data/DataTable").then((mod) => mod.DataTable),
  { loading: () => <Skeleton variant="table" /> },
) as <T extends object>(props: DataTableProps<T>) => React.JSX.Element;

const ClinicFormModal = dynamic(
  () => import("@/components/business/ClinicFormModal").then((mod) => mod.ClinicFormModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import { useClinicsList, useCreateClinic, useUpdateClinic, useDeleteClinic } from "@/features/clinics";
import type { ClinicRecord } from "@/types/models/clinic";
import type { CreateClinicInput, UpdateClinicInput } from "@/schemas/clinic";
import { cn } from "@/lib/utils";

function ClinicActions({
  clinic,
  onEdit,
  onDelete,
}: {
  clinic: ClinicRecord;
  onEdit: (clinic: ClinicRecord) => void;
  onDelete: (clinic: ClinicRecord) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onEdit(clinic)}
        aria-label={`Edit ${clinic.name}`}
        title={`Edit ${clinic.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onDelete(clinic)}
        aria-label={`Delete ${clinic.name}`}
        title={`Delete ${clinic.name}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function MissingValue() {
  return <span className="text-muted-foreground">—</span>;
}

export default function AdminClinicsPage() {
  const { data: allClinics, isPending, isError, refetch } = useClinicsList();
  const { mutate: createClinic, isPending: isCreating } = useCreateClinic();
  const { mutate: updateClinic, isPending: isUpdating } = useUpdateClinic();
  const { mutate: deleteClinic, isPending: isDeleting } = useDeleteClinic();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<ClinicRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ClinicRecord | null>(null);

  const clinics = useMemo(() => allClinics ?? [], [allClinics]);

  const cityOptions = useMemo<FilterOption[]>(() => {
    const seen = new Set<string>();
    const values: string[] = [];
    for (const clinic of clinics) {
      if (clinic.city && !seen.has(clinic.city)) {
        seen.add(clinic.city);
        values.push(clinic.city);
      }
    }
    return values.sort((a, b) => a.localeCompare(b)).map((value) => ({ value, label: value }));
  }, [clinics]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clinics.filter((clinic) => {
      if (city && clinic.city !== city) return false;
      if (!query) return true;
      return [clinic.name, clinic.phone ?? "", clinic.address ?? "", clinic.city ?? "", clinic.description ?? ""]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [clinics, search, city]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / limit)), [filtered, limit]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCityChange(value: string | undefined) {
    setCity(value);
    setPage(1);
  }

  function handleLimitChange(value: number) {
    setLimit(value);
    setPage(1);
  }

  const columns: Column<ClinicRecord>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (clinic) => (
          <span className="block max-w-[16rem] truncate font-medium" title={clinic.name}>
            {clinic.name}
          </span>
        ),
      },
      {
        key: "id",
        header: "ID",
        render: (clinic) => (
          <span
            className={cn("block max-w-[10rem] truncate font-mono text-xs text-muted-foreground")}
            title={clinic.id}
          >
            {clinic.id}
          </span>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        render: (clinic) => clinic.phone ?? <MissingValue />,
      },
      {
        key: "city",
        header: "City",
        render: (clinic) => clinic.city ?? <MissingValue />,
      },
      {
        key: "doctorsCount",
        header: "Doctors",
        render: (clinic) => clinic.doctorsCount,
      },
      {
        key: "address",
        header: "Address",
        render: (clinic) => clinic.address ?? <MissingValue />,
      },
      {
        key: "description",
        header: "Description",
        render: (clinic) =>
          clinic.description ? (
            <span
              className="block max-w-[20rem] truncate text-muted-foreground"
              title={clinic.description}
            >
              {clinic.description}
            </span>
          ) : (
            <MissingValue />
          ),
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        render: (clinic) => (
          <div className="flex items-center justify-end">
            <ClinicActions clinic={clinic} onEdit={setEditing} onDelete={setDeleting} />
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clinics</h1>
          <p className="text-lg text-muted-foreground">
            Manage clinic locations.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Add clinic
        </Button>
      </header>

      {isError ? (
        <ErrorBanner message="Could not load clinics." onRetry={refetch} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-xs">
              <SearchInput
                value={search}
                onChange={handleSearch}
                placeholder="Search by name, city, phone..."
              />
            </div>
            <FilterDropdown
              options={cityOptions}
              value={city}
              onChange={handleCityChange}
              label="City"
              placeholder="All cities"
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
                  icon={<Building2 className="size-12" />}
                  title="No clinics found"
                  description="No clinics match the current search and filters."
                />
              </div>
            ) : (
              paginated.map((clinic) => (
                <Card key={clinic.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{clinic.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {clinic.city ?? clinic.address ?? "—"}
                        </p>
                      </div>
                      <ClinicActions clinic={clinic} onEdit={setEditing} onDelete={setDeleting} />
                    </div>
                    {clinic.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{clinic.description}</p>
                    )}
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd className="text-foreground">{clinic.phone ?? "—"}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Doctors</dt>
                        <dd className="text-foreground">{clinic.doctorsCount}</dd>
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <dt className="text-muted-foreground">Address</dt>
                        <dd className="text-foreground">{clinic.address ?? "—"}</dd>
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <dt className="text-muted-foreground">ID</dt>
                        <dd className="truncate font-mono text-foreground">{clinic.id}</dd>
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
                  icon={<Building2 className="size-12" />}
                  title="No clinics found"
                  description="No clinics match the current search and filters."
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

      {creating && (
        <ClinicFormModal
          open
          onClose={() => setCreating(false)}
          isSubmitting={isCreating}
          onSubmit={(data) => {
            createClinic(data as CreateClinicInput, { onSuccess: () => setCreating(false) });
          }}
        />
      )}

      {editing && (
        <ClinicFormModal
          open
          onClose={() => setEditing(null)}
          clinic={editing}
          isSubmitting={isUpdating}
          onSubmit={(data) => {
            updateClinic(
              { id: editing.id, data: data as UpdateClinicInput },
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
            deleteClinic(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title="Delete clinic"
          message={`Delete ${deleting.name}? This cannot be undone. Deleting fails if any doctor is assigned to this clinic.`}
          confirmLabel="Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}