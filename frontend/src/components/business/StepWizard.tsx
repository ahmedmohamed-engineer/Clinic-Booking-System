"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BiroCircle } from "@/components/business/BiroCircle";

interface Step {
  title: string;
  content: ReactNode;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function StepWizard({
  steps,
  currentStep,
  onNext,
  onBack,
  isNextDisabled,
  isLastStep,
  isLoading,
  className,
}: StepWizardProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    // The mobile action bar is fixed to the viewport bottom so the primary
    // action stays within thumb reach while content scrolls. The app shell
    // scrolls the document (main is a content-sized overflow-auto container),
    // which makes sticky-to-viewport unreliable, so we use fixed instead and
    // add bottom padding on the wizard so the bar never occludes the last
    // step's content. sm+ keeps the original static layout and spacing.
    <div className={cn("space-y-6 pb-28 sm:pb-0", className)}>
      <div className="space-y-2">
        {/* Compact step context on mobile; the full labeled indicator appears at sm+ */}
        <div className="flex items-baseline justify-between gap-2 sm:hidden">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="truncate text-sm font-semibold text-primary">
            {steps[currentStep]?.title}
          </span>
        </div>

        {/* The pad lines: written steps are crossed off, the current one is
            circled in biro, the rest are still blank lines. */}
        <div className="hidden items-center justify-between sm:flex">
          {steps.map((step, i) => (
            <span
              key={i}
              aria-current={i === currentStep ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                i === currentStep
                  ? "text-primary"
                  : i < currentStep
                    ? "text-success"
                    : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "relative flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                  i === currentStep
                    ? "border-primary text-primary"
                    : i < currentStep
                      ? "border-success text-success"
                      : "border-border text-muted-foreground",
                )}
              >
                {i === currentStep ? (
                  <BiroCircle className="absolute -inset-[5px] size-[calc(100%+10px)] text-primary" />
                ) : null}
                {i < currentStep ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  i < currentStep && "line-through decoration-success/60",
                )}
              >
                {step.title}
              </span>
            </span>
          ))}
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Booking progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="min-h-[200px]">{steps[currentStep]?.content}</div>

      {/* Fixed action bar on mobile (see comment above); static side-by-side row on sm+ */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2 border-t border-border bg-card px-10 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:inset-auto sm:flex-row sm:justify-between sm:border-t-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-4">
        <Button
          variant="outline"
          className="pointer-coarse:min-h-11 w-1/3 shrink-0 sm:w-auto"
          onClick={onBack}
          disabled={currentStep === 0 || isLoading}
        >
          Back
        </Button>
        <Button
          className="pointer-coarse:min-h-11 flex-1 sm:flex-none sm:w-auto"
          onClick={onNext}
          disabled={isNextDisabled || isLoading}
        >
          {isLoading ? "Loading..." : isLastStep ? "Confirm" : "Next"}
        </Button>
      </div>
    </div>
  );
}