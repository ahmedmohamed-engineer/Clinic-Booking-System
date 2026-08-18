"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast-store";
import { useUploadAvatar } from "@/features/auth";

interface AvatarUploaderProps {
  src?: string | null;
  fallback: string;
  onSuccess?: (avatarUrl: string | null) => void;
  buttonLabel?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;

export function AvatarUploader({
  src,
  fallback,
  onSuccess,
  buttonLabel,
}: AvatarUploaderProps) {
  const t = useTranslations("business.avatarUploader");
  const tc = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const { mutate: uploadAvatar, isPending } = useUploadAvatar();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Revoke the object URL on unmount so a preview never leaks.
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const displaySrc = preview ?? src;

  function clearPreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreview(null);
    setSelectedFile(null);
    setError(null);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("typeError"));
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t("sizeError"));
      return;
    }

    setError(null);
    setSelectedFile(file);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreview(url);
  };

  const handleSave = () => {
    if (!selectedFile) return;

    uploadAvatar(selectedFile, {
      onSuccess: (user) => {
        clearPreview();
        onSuccess?.(user.avatarUrl ?? null);
        showToast(t("updated"), "success");
      },
      // If the upload fails, drop the uncommitted preview so the UI never
      // shows a photo the server doesn't have. The error toast comes from the hook.
      onError: () => {
        clearPreview();
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        className="group relative cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={t("uploadAvatar")}
      >
        <Avatar
          src={displaySrc}
          fallback={fallback}
          className="size-[150px] text-2xl"
          width={150}
          height={150}
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-8 text-white" aria-hidden="true" />
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {preview && (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? t("saving") : t("saveAvatar")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearPreview}
            disabled={isPending}
          >
            {tc("cancel")}
          </Button>
        </div>
      )}

      {!preview && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            aria-label={t("changeProfilePhoto")}
            title={t("changeProfilePhoto")}
            className="cursor-pointer shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Camera className="size-3.5" aria-hidden="true" />
            {buttonLabel ?? t("changePhoto")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("hint")}
          </p>
        </>
      )}
    </div>
  );
}