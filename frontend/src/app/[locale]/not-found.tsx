import { useTranslations } from "next-intl";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <AuthLayout>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <EmptyState
          icon={<FileQuestion className="size-12" />}
          title={t("pageNotFound")}
          description={t("pageNotFoundDesc")}
        />
      </main>
    </AuthLayout>
  );
}