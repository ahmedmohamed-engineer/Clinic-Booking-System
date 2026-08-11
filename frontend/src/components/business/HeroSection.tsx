import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  CreditCard,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  className?: string;
}

const trustPoints = [
  { icon: CalendarDays, label: "Book online" },
  { icon: ShieldCheck, label: "Trusted doctors" },
  { icon: CreditCard, label: "Simple payments" },
];

const bookingSteps = [
  { label: "Choose a doctor", hint: "Today" },
  { label: "Pick a time", hint: "10:30 AM" },
  { label: "Confirm", hint: "Instant" },
];

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn("relative flex-1 overflow-hidden", className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[30rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container-custom relative flex w-full flex-col items-center justify-center gap-14 py-16 sm:py-20 lg:flex-row lg:gap-20 lg:py-24">
        <div className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Modern care, simple booking
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Your health journey,{" "}
            <span className="text-primary">simplified</span>
          </h1>

          <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            Book appointments with top doctors, manage your schedule, and take
            control of your healthcare — all in one place.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link href="/register" className="sm:inline-flex">
              <Button size="lg" className="w-full sm:w-auto">
                Get started
                <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/login" className="sm:inline-flex">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign in
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

        <div className="relative w-full max-w-md">
          <div
            aria-hidden="true"
            className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 blur-2xl"
          />

          <div className="relative rounded-3xl border border-border bg-surface-container-lowest p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HeartPulse className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">MediCare</p>
                <p className="text-xs text-muted-foreground">
                  Online appointment booking
                </p>
              </div>
              <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-status-success">
                <span className="size-1.5 rounded-full bg-status-success" />
                Online
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {bookingSteps.map(({ label, hint }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3.5"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl",
                      i === 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-container-high text-muted-foreground",
                    )}
                  >
                    {i === 0 ? (
                      <CalendarDays className="size-4" aria-hidden="true" />
                    ) : i === 1 ? (
                      <Clock className="size-4" aria-hidden="true" />
                    ) : (
                      <Check className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{hint}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground">
              <span className="text-sm font-semibold">Confirm booking</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </div>
          </div>

          <div className="absolute -left-3 top-12 hidden items-center gap-2.5 rounded-2xl border border-border bg-surface-container-lowest px-4 py-3 shadow-lg sm:flex">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-success/10 text-status-success">
              <CircleCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Appointment confirmed
              </p>
              <p className="text-[0.7rem] text-muted-foreground">See you soon</p>
            </div>
          </div>

          <div className="absolute -right-3 bottom-12 hidden items-center gap-2.5 rounded-2xl border border-border bg-surface-container-lowest px-4 py-3 shadow-lg sm:flex">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">Trusted care</p>
              <p className="text-[0.7rem] text-muted-foreground">Verified doctors</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
