"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <span
              key={i}
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
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                  i === currentStep
                    ? "border-primary bg-primary/10 text-primary"
                    : i < currentStep
                      ? "border-success bg-success/10 text-success"
                      : "border-border text-muted-foreground",
                )}
              >
                {i < currentStep ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </span>
          ))}
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-container-high">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="min-h-[200px]">{steps[currentStep]?.content}</div>

      <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onBack}
          disabled={currentStep === 0 || isLoading}
        >
          Back
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={onNext}
          disabled={isNextDisabled || isLoading}
        >
          {isLoading ? "Loading..." : isLastStep ? "Confirm" : "Next"}
        </Button>
      </div>
    </div>
  );
}
