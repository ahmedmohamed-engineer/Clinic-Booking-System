"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
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
  buttonLabel = "Change Photo",
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadAvatar, isPending } = useUploadAvatar();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displaySrc = preview ?? src;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images are supported.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be smaller than 2MB.");
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (!selectedFile) return;

    uploadAvatar(selectedFile, {
      onSuccess: (user) => {
        setPreview(null);
        setSelectedFile(null);
        onSuccess?.(user.avatarUrl ?? null);
        showToast("Avatar updated successfully", "success");
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Upload avatar"
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
            {isPending ? "Saving..." : "Save Avatar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPreview(null);
              setError(null);
            }}
            disabled={isPending}
          >
            Cancel
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
            aria-label="Change profile photo"
            title="Change profile photo"
            className="cursor-pointer shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Camera className="size-3.5" aria-hidden="true" />
            {buttonLabel}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, or WebP up to 2MB.
          </p>
        </>
      )}
    </div>
  );
}