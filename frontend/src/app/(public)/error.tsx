"use client";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/layout/Logo";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center border-b border-border px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
