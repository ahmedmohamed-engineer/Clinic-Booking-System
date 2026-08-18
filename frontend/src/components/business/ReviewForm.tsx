"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/business/StarRating";
import { createReviewSchema, type CreateReviewInput } from "@/schemas/review";
import { useApiError } from "@/hooks/useApiError";

interface ReviewFormProps {
  appointmentId: string;
  onSubmit: (data: CreateReviewInput) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function ReviewForm({ appointmentId, onSubmit, isSubmitting }: ReviewFormProps) {
  const t = useTranslations("adminForm");
  const { parse } = useApiError();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const result = createReviewSchema.safeParse({
      appointmentId,
      rating,
      comment: comment.trim() === "" ? null : comment.trim(),
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    Promise.resolve(onSubmit(result.data)).catch((err: unknown) => {
      const { message } = parse(err);
      setFormError(message);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="rating">{t("rating")}</Label>
        <div id="rating" className="flex items-center gap-2">
          <StarRating rating={rating} onChange={setRating} />
          {fieldErrors.rating && (
            <p className="text-xs text-destructive">{fieldErrors.rating}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">{t("commentOptional")}</Label>
        <Textarea
          id="comment"
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          placeholder={t("reviewPlaceholder")}
          aria-invalid={Boolean(fieldErrors.comment)}
          disabled={isSubmitting}
        />
        {fieldErrors.comment && (
          <p className="text-xs text-destructive">{fieldErrors.comment}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          {isSubmitting ? t("submitting") : t("submitReview")}
        </Button>
      </div>
    </form>
  );
}
