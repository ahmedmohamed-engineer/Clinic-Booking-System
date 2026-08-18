"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          {t("errors.somethingWrong")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("errors.unexpected")}
        </p>
        <Button onClick={() => reset()}>{t("common.tryAgain")}</Button>
      </div>
    </div>
  );
}