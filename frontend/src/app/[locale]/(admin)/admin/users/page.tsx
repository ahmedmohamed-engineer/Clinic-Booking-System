"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
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

const pillBase =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";

const roleBadgeClass: Record<string, string> = {
  patient: "border-status-info/25 bg-status-info/10 text-status-info",
  doctor: "border-status-success/25 bg-status-success/10 text-status-success",
  admin: "border-primary/25 bg-primary/10 text-primary",
};

function RoleBadge({ role }: { role: UserRecord["role"] }) {
  const tr = useTranslations("admin");
  return (
    <span
      className={`${pillBase} capitalize ${roleBadgeClass[role] ?? "border-border text-muted-foreground"}`}
    >
      {tr(`roles.${role}`)}
    </span>
  );
}

function VerifiedBadge({ isVerified }: { isVerified: boolean }) {
  const ts = useTranslations("adminShared");
  return isVerified ? (
    <span className={`${pillBase} border-status-success/25 bg-status-success/10 text-status-success`}>
      {ts("verified")}
    </span>
  ) : (
    <span className={`${pillBase} border-status-neutral/25 bg-status-neutral/10 text-status-neutral`}>
      {ts("notVerified")}
    </span>
  );
}

function StatusBadge({ deletedAt }: { deletedAt: string | null }) {
  const ts = useTranslations("adminShared");
  return deletedAt ? (
    <span className={`${pillBase} border-status-danger/25 bg-status-danger/10 text-status-danger`}>
      {ts("deleted")}
    </span>
  ) : (
    <span className={`${pillBase} border-status-success/25 bg-status-success/10 text-status-success`}>
      {ts("active")}
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
  const ts = useTranslations("adminShared");
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onEdit(user)}
        aria-label={ts("editName", { name: user.email })}
        title={ts("editName", { name: user.email })}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onDelete(user)}
        aria-label={ts("deleteName", { name: user.email })}
        title={ts("deleteName", { name: user.email })}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export default function AdminUsersPage() {
  const t = useTranslations("adminUsers");
  const ts = useTranslations("adminShared");
  const tr = useTranslations("admin");
  const locale = useLocale();

  const roleOptions: FilterOption[] = [
    { value: "patient", label: tr("roles.patient") },
    { value: "doctor", label: tr("roles.doctor") },
    { value: "admin", label: tr("roles.admin") },
  ];

  const verifiedOptions: FilterOption[] = [
    { value: "true", label: ts("verified") },
    { value: "false", label: ts("notVerified") },
  ];

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
        header: ts("user"),
        render: (user) => <UserCell user={user} />,
      },
      {
        key: "email",
        header: ts("email"),
        sortable: true,
        render: (user) => <span className="truncate">{user.email}</span>,
      },
      {
        key: "role",
        header: ts("role"),
        render: (user) => <RoleBadge role={user.role} />,
      },
      {
        key: "isVerified",
        header: ts("verification"),
        render: (user) => <VerifiedBadge isVerified={user.isVerified} />,
      },
      {
        key: "createdAt",
        header: ts("createdAt"),
        render: (user) => formatDate(user.createdAt, locale),
      },
      {
        key: "updatedAt",
        header: ts("updatedAt"),
        render: (user) => formatDate(user.updatedAt, locale),
      },
      {
        key: "deletedAt",
        header: ts("status"),
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
    [ts, locale],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      {isError ? (
        <ErrorBanner message={t("error")} onRetry={refetch} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-xs">
              <SearchInput
                value={search}
                onChange={handleSearch}
                placeholder={ts("searchByEmail")}
              />
            </div>
            <FilterDropdown
              options={roleOptions}
              value={role}
              onChange={handleRoleChange}
              label={ts("role")}
              placeholder={ts("allRoles")}
            />
            <FilterDropdown
              options={verifiedOptions}
              value={isVerified === undefined ? undefined : String(isVerified)}
              onChange={handleVerifiedChange}
              label={ts("verification")}
              placeholder={ts("all")}
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
              {deletedOnly ? ts("showingDeletedOnly") : ts("showDeletedOnly")}
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
                  title={t("emptyTitle")}
                  description={t("emptyDesc")}
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
                        <dt className="text-muted-foreground">{ts("createdAt")}</dt>
                        <dd className="text-foreground">{formatDate(user.createdAt, locale)}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-muted-foreground">{ts("updatedAt")}</dt>
                        <dd className="text-foreground">{formatDate(user.updatedAt, locale)}</dd>
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
                  title={t("emptyTitle")}
                  description={t("emptyDesc")}
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
          title={t("deleteTitle")}
          message={t("deleteMessage", { email: deleting.email })}
          confirmLabel={ts("delete")}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}