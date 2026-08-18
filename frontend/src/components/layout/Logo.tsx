import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
}

/** The prescription mark: an Rx drawn in stamp-ink, set beside the letterhead wordmark. */
export function RxMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "stamp-ring size-8 shrink-0 text-lg leading-none font-bold",
        className,
      )}
    >
      <span className="-mt-0.5 font-ink text-xl">Rx</span>
    </span>
  );
}

export function Logo({ href = "/", className }: LogoProps) {
  const t = useTranslations("logo");

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      aria-label={t("aria")}
    >
      <RxMark className="transition-transform duration-200 group-hover:-rotate-3 motion-reduce:transition-none" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-foreground">
          Medi<span className="text-primary">Care</span>
        </span>
        <span className="heading-2 mt-1 text-[0.6rem] tracking-[0.18em]">
          {t("tagline")}
        </span>
      </span>
    </Link>
  );
}