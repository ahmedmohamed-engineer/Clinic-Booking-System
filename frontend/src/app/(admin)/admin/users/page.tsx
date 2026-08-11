"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Pencil, Trash2, Users, Archive } from "lucide-react";
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
import { formatDate } from "@/lib/utils";

const DataTable = dynamic(
  () => import("@/components/data/DataTable").then((mod) => mod.DataTable),
  { loading: () => <Skeleton variant="table" /> },
) as <T extends object>(props: DataTableProps<T>) => React.JSX.Element;

const UserFormModal = dynamic(
  () => import("@/components/business/UserFormModal").then((mod) => mod.UserFormModal),
  { loading: () => <Skeleton variant="form" /> },
);

const ConfirmDialog = dynamic(
  () => import("@/components/business/ConfirmDialog").then((mod) => mod.ConfirmDialog),
  { loading: () => <Skeleton variant="form" /> },
);
import {
  useUsersAdmin,
  useUpdateUserAdmin,
  useDeleteUserAdmin,
} from "@/features/users";
import { getUsersAdmin } from "@/features/users/api/users-admin";
import { usePrefetchAdminPage } from "@/hooks/usePrefetchAdminPage";
import { queryKeys } from "@/lib/query-keys";
import { PAGINATION_DEFAULTS } from "@/config";
import type { UserRecord } from "@/types/models/user";
import type { UpdateUserInput } from "@/schemas/user";

const roleOptions: FilterOption[] = [
  { value: "patient", label: "Patient" },
  { value: "doctor", label: "Doctor" },
  { value: "admin", label: "Admin" },
];

const verifiedOptions: FilterOption[] = [
  { value: "true", label: "Verified" },
  { value: "false", label: "Not verified" },
];

const pillBase =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";

const roleBadgeClass: Record<string, string> = {
  patient: "border-status-info/25 bg-status-info/10 text-status-info",
  doctor: "border-status-success/25 bg-status-success/10 text-status-success",
  admin: "border-primary/25 bg-primary/10 text-primary",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`${pillBase} capitalize ${roleBadgeClass[role] ?? "border-border text-muted-foreground"}`}
    >
      {role}
    </span>
  );
}

function VerifiedBadge({ isVerified }: { isVerified: boolean }) {
  return isVerified ? (
    <span className={`${pillBase} border-status-success/25 bg-status-success/10 text-status-success`}>
      Verified
    </span>
  ) : (
    <span className={`${pillBase} border-status-neutral/25 bg-status-neutral/10 text-status-neutral`}>
      Not verified
    </span>
  );
}

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

function UserCell({ user }: { user: UserRecord }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar
        src={user.avatarUrl}
        fallback={user.fullName ?? user.email}
        className="size-8 shrink-0"
        width={32}
        height={32}
      />
      <div className="min-w-0">
        <span className="truncate font-medium">{user.fullName ?? user.email}</span>
        {user.fullName && (
          <span className="block truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        )}
      </div>
    </div>
  );
}

function UserActions({
  user,
  onEdit,
  onDelete,
}: {
  user: UserRecord;
  onEdit: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onEdit(user)}
        aria-label={`Edit ${user.email}`}
        title={`Edit ${user.email}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onDelete(user)}
        aria-label={`Delete ${user.email}`}
        title={`Delete ${user.email}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState<number>(PAGINATION_DEFAULTS.page);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string | undefined>(undefined);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);
  const [deletedOnly, setDeletedOnly] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState<UserRecord | null>(null);

  const { data, isPending, isError, refetch } = useUsersAdmin({
    page,
    limit: PAGINATION_DEFAULTS.limit,
    search: search || undefined,
    role: role as UserRecord["role"],
    isVerified,
    deletedOnly: deletedOnly || undefined,
  });
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUserAdmin();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUserAdmin();

  const users = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const prefetchPage = usePrefetchAdminPage({
    queryKey: queryKeys.users.all,
    queryFn: getUsersAdmin,
    params: {
      page,
      limit: PAGINATION_DEFAULTS.limit,
      search: search || undefined,
      role: role as UserRecord["role"],
      isVerified,
      deletedOnly: deletedOnly || undefined,
    },
    page,
    totalPages,
  });

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleRoleChange(value: string | undefined) {
    setRole(value);
    setPage(1);
  }

  function handleVerifiedChange(value: string | undefined) {
    setIsVerified(value === undefined ? undefined : value === "true");
    setPage(1);
  }

  function handleDeletedOnlyChange() {
    setDeletedOnly((value) => !value);
    setPage(1);
  }

  const columns = useMemo<Column<UserRecord>[]>(
    () => [
      {
        key: "fullName",
        header: "User",
        render: (user) => <UserCell user={user} />,
      },
      {
        key: "email",
        header: "Email",
        sortable: true,
        render: (user) => <span className="truncate">{user.email}</span>,
      },
      {
        key: "role",
        header: "Role",
        render: (user) => <RoleBadge role={user.role} />,
      },
      {
        key: "isVerified",
        header: "Verification",
        render: (user) => <VerifiedBadge isVerified={user.isVerified} />,
      },
      {
        key: "createdAt",
        header: "Created at",
        render: (user) => formatDate(user.createdAt),
      },
      {
        key: "updatedAt",
        header: "Updated at",
        render: (user) => formatDate(user.updatedAt),
      },
      {
        key: "deletedAt",
        header: "Status",
        render: (user) => <StatusBadge deletedAt={user.deletedAt} />,
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        render: (user) => (
          <div className="flex items-center justify-end">
            <UserActions user={user} onEdit={setEditing} onDelete={setDeleting} />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Users</h1>
        <p className="text-lg text-muted-foreground">
          Manage user accounts, roles, and verification status.
        </p>
      </header>

      {isError ? (
        <ErrorBanner message="Could not load users." onRetry={refetch} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-xs">
              <SearchInput
                value={search}
                onChange={handleSearch}
                placeholder="Search by email..."
              />
            </div>
            <FilterDropdown
              options={roleOptions}
              value={role}
              onChange={handleRoleChange}
              label="Role"
              placeholder="All roles"
            />
            <FilterDropdown
              options={verifiedOptions}
              value={isVerified === undefined ? undefined : String(isVerified)}
              onChange={handleVerifiedChange}
              label="Verification"
              placeholder="All"
            />
            <Button
              type="button"
              variant={deletedOnly ? "default" : "outline"}
              size="sm"
              onClick={handleDeletedOnlyChange}
              aria-pressed={deletedOnly}
              className="h-9"
            >
              <Archive className="size-4" aria-hidden="true" />
              {deletedOnly ? "Showing deleted only" : "Show deleted only"}
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:hidden">
            {isPending ? (
              <>
                <Skeleton variant="card" />
                <Skeleton variant="card" />
                <Skeleton variant="card" />
              </>
            ) : users.length === 0 ? (
              <div className="rounded-xl border border-border">
                <EmptyState
                  icon={<Users className="size-12" />}
                  title="No users found"
                  description="No users match the current search and filters."
                />
              </div>
            ) : (
              users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar
                          src={user.avatarUrl}
                          fallback={user.fullName ?? user.email}
                          className="size-10 shrink-0"
                          width={40}
                          height={40}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {user.fullName ?? user.email}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <UserActions user={user} onEdit={setEditing} onDelete={setDeleting} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <RoleBadge role={user.role} />
                      <VerifiedBadge isVerified={user.isVerified} />
                      <StatusBadge deletedAt={user.deletedAt} />
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Created at</dt>
                        <dd className="text-foreground">{formatDate(user.createdAt)}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">Updated at</dt>
                        <dd className="text-foreground">{formatDate(user.updatedAt)}</dd>
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
              data={users}
              loading={isPending}
              sortable
              emptyState={
                <EmptyState
                  icon={<Users className="size-12" />}
                  title="No users found"
                  description="No users match the current search and filters."
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

      {editing && (
        <UserFormModal
          open
          onClose={() => setEditing(null)}
          user={editing}
          isSubmitting={isUpdating}
          onSubmit={(data: UpdateUserInput) => {
            updateUser(
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
            deleteUser(deleting.id, { onSuccess: () => setDeleting(null) })
          }
          title="Delete user"
          message={`Delete ${deleting.email}? The account will be soft-deleted and can no longer sign in.`}
          confirmLabel="Delete"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}