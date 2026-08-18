import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { RxMark } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  className?: string;
}

/* The lines written onto the pad — the first two inked, the last one
   still being written. Kalam only here, where the hand is the story.
   The labels are doc chrome (translated); the values are the patient's
   data, which reads as written content in either language. */
export function HeroSection({ className }: HeroSectionProps) {
  const t = useTranslations("hero");

  const trustPoints = [
    { icon: CalendarDays, label: t("bookOnline") },
    { icon: ShieldCheck, label: t("trustedDoctors") },
    { icon: CreditCard, label: t("simplePayments") },
  ];

  const padLines = [
    { label: t("labels.specialist"), value: "Dr. Maya Hassan", meta: "Cardiology", inked: true },
    { label: t("labels.visit"), value: "Thu, Aug 21", meta: "10:30 AM", inked: true },
    { label: t("labels.clinic"), value: "Downtown branch", meta: "Branch 04", inked: false },
  ];

  return (
    <section className={cn("flex-1", className)}>
      <div className="container-custom relative flex w-full flex-col items-center justify-center gap-14 py-16 sm:py-20 lg:flex-row lg:items-start lg:gap-20 lg:py-24">
        {/* ---- The pitch, spoken by the desk ---- */}
        <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary">
            <RxMark className="size-5 text-sm" />
            {t("eyebrow")}
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            {t("h1a")} <span className="text-primary">{t("h1b")}</span>
          </h1>

          <p className="body-text mt-5 max-w-lg text-base sm:text-lg">
            {t("paragraph")}
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link href="/register" className="sm:inline-flex">
              <Button size="lg" className="w-full sm:w-auto">
                {t("getStarted")}
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover/button:translate-x-0.5 rtl:-translate-x-0.5 rtl:rotate-180"
                  data-icon="inline-end"
                  aria-hidden="true"
                />
              </Button>
            </Link>
            <Link href="/login" className="sm:inline-flex">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                {t("signIn")}
              </Button>
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 lg:justify-start">
            {trustPoints.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* ---- The pad itself: the first viewport ---- */}
        <div className="relative w-full max-w-md">
          {/* Carbon copy, tucked behind and offset */}
          <div
            aria-hidden="true"
            className="absolute inset-x-4 -top-3 bottom-2 hidden rotate-2 rounded-lg border border-border/70 bg-card/60 px-6 py-4 opacity-70 sm:block"
          >
            <div className="heading-2 text-muted-foreground/50">
              {t("eyebrow")}
            </div>
            <div className="mt-4 space-y-3">
              {padLines.map((line) => (
                <div key={line.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground/40">{line.label}</span>
                  <span className="tabular text-muted-foreground/40">
                    {line.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 inline-block rotate-[-6deg] border border-destructive/30 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-destructive/40">
              {t("copy")}
            </div>
          </div>

          {/* The sheet being filled in */}
          <div className="paper-sheet relative z-10 px-7 py-6 shadow-lg">
            {/* Letterhead */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                  <RxMark className="size-6 text-sm" />
                  MediCare
                </p>
                <p className="heading-2 mt-1.5">{t("eyebrow")}</p>
              </div>
              <span className="tabular heading-2 text-muted-foreground">
                {t("no")}
              </span>
            </div>
            <div className="letterhead-rule mt-4" />

            {/* Ruled writing field */}
            <div className="ruled mt-4 pb-1">
              {padLines.map((line, i) => (
                <div
                  key={line.label}
                  className="animate-fade-in flex items-baseline justify-between gap-4 py-[0.35rem]"
                  style={{ animationDelay: `${0.25 + i * 0.3}s` }}
                >
                  <span className="heading-2 shrink-0 text-muted-foreground">
                    {line.label}
                  </span>
                  {line.inked ? (
                    <span className="font-ink text-base leading-snug font-bold text-secondary sm:text-lg">
                      {line.value}
                      <span className="ms-2 inline-block align-baseline text-[0.65rem] font-normal tracking-wide text-muted-foreground sm:ms-3">
                        {line.meta}
                      </span>
                    </span>
                  ) : (
                    <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
                      <span className="font-ink text-base leading-snug text-muted-foreground/80 sm:text-lg">
                        {line.value}
                      </span>
                      <span className="inline-block h-[1.1em] w-[2px] animate-pulse bg-primary align-middle" />
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* The stamp falls here */}
            <Link href="/register" className="mt-6 block">
              <Button
                size="lg"
                className="w-full font-bold uppercase tracking-widest transition-transform duration-150 hover:-rotate-1 active:translate-y-0.5"
              >
                {t("confirmBooking")}
                <span className="ms-2 inline-block size-2 rounded-full border border-current" />
              </Button>
            </Link>

            <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">
              {t("written", { hours: t("hours") })}
            </p>
          </div>

          {/* Desk notes floating around the pad */}
          <div className="absolute -right-3 top-8 hidden items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 shadow-md sm:flex">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-status-success/10 text-status-success">
              <CalendarDays className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">
                {t("confirmed")}
              </p>
              <p className="text-xs text-muted-foreground">{t("seeYouSoon")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}