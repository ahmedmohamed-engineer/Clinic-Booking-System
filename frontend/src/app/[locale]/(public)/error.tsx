"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/layout/Logo";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center border-b border-border px-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-2xl font-bold text-foreground">{t("errors.somethingWrong")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("errors.unexpected")}
          </p>
          <Button onClick={() => reset()}>{t("common.tryAgain")}</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
