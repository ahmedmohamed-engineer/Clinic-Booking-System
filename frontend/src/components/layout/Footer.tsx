import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { RxMark } from "./Logo";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-border px-6 py-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      <div className="mb-3 flex justify-center">
        <span className="letterhead-rule inline-flex items-center gap-2 px-6 pb-3">
          <RxMark className="size-5 text-xs" />
          <span className="heading-2">{t("tagline")}</span>
        </span>
      </div>
      &copy; {year} MediCare. {t("rights")}
    </footer>
  );
}