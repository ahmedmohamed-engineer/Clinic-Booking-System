"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { Avatar } from "@/components/ui/avatar";
import { resolveDisplayName } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  /** Where the "Profile" item navigates. Defaults to "/profile". */
  profileHref?: string;
}

export function UserMenu({ profileHref = "/profile" }: UserMenuProps) {
  const { user } = useAuth();
  const { submit: logout, isPending } = useLogout();
  const router = useRouter();

  if (!user) return null;

  const displayName = resolveDisplayName([user.fullName], user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar src={user.avatarUrl} fallback={displayName} />
        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-foreground sm:block">
          {displayName}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center gap-2 px-2.5 py-2">
          <Avatar src={user.avatarUrl} fallback={displayName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(profileHref)}>
          <UserRound className="size-4" aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} disabled={isPending}>
          <LogOut className="size-4" aria-hidden="true" />
          {isPending ? "Signing out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}