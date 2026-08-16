"use client";

import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLogin } from "@/features/auth/hooks/use-login";
import { getHomePathForRole } from "@/lib/routing";
import type { UserRole } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function isAllowedRedirect(role: UserRole, path: string): boolean {
  const isAdminPath = path.startsWith("/admin");
  return role === "admin" ? isAdminPath : !isAdminPath;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const redirectRaw = searchParams.get("redirect");
  const redirectParam =
    redirectRaw && redirectRaw.startsWith("/") ? redirectRaw : null;
  const { submit, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const target =
      redirectParam &&
      redirectParam !== "/login" &&
      isAllowedRedirect(user.role, redirectParam)
        ? redirectParam
        : getHomePathForRole(user.role);
    router.replace(target);
  }, [isAuthenticated, user, redirectParam, router]);

  async function onSubmit(data: LoginInput) {
    try {
      await submit(data.email, data.password);
    } catch {
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="paper-sheet w-full max-w-sm space-y-6 px-8 py-8 shadow-md">
        <div className="space-y-1 text-center">
          <h1 className="heading-1">Sign in</h1>
          <p className="body-text">Welcome back to MediCare</p>
        </div>
        <div className="letterhead-rule" />

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              hasError={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive" role="alert">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              hasError={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive" role="alert">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
