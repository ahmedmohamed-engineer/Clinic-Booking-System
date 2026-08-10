"use client";

import { useMutation } from "@tanstack/react-query";
import { useApiError } from "@/hooks/useApiError";
import { showToast } from "@/lib/toast-store";
import { uploadAvatar } from "../api/auth.api";

export function useUploadAvatar() {
  const { parse } = useApiError();

  return useMutation({
    mutationFn: uploadAvatar,
    onError: (error) => {
      const { message } = parse(error);
      showToast(message, "error");
    },
  });
}