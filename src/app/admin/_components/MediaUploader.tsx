"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { Select } from "@/shared/components/ui/Select";

type MediaOption = { id: string; label: string; source: string; type: "IMAGE" | "VIDEO" };
type ProjectCoverOption = { id: string; label: string };

function getUploadOwner(destination: string) {
  if (destination === "profile") {
    return { type: "profile" } as const;
  }

  if (destination.startsWith("project:")) {
    return { type: "project-cover", id: destination.slice("project:".length) } as const;
  }

  return { type: "media-block", id: destination } as const;
}

export function MediaUploader({
  media,
  projectCovers,
}: {
  media: MediaOption[];
  projectCovers: ProjectCoverOption[];
}) {
  const [destination, setDestination] = useState("profile");

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<string | null>(null);

  const [progress, setProgress] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const [message, setMessage] = useState("");

  useEffect(
    () => () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    },
    [preview],
  );

  function chooseFile(selected: File | null) {
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    setProgress("idle");
  }

  async function upload() {
    if (!file) {
      return;
    }

    setProgress("uploading");
    const body = new FormData();

    body.set("file", file);
    body.set("owner", JSON.stringify(getUploadOwner(destination)));
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body });

      const payload = (await response.json()) as { message?: string; cleanupWarning?: boolean };

      if (!response.ok) {
        throw new Error(payload.message || "Upload failed.");
      }

      setProgress("success");
      setMessage(
        payload.cleanupWarning
          ? "Published. The previous object needs manual cleanup."
          : "Published and the previous managed object was removed.",
      );
    } catch {
      setProgress("error");
      setMessage("The media replacement could not be published. The existing media is unchanged.");
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
      <div>
        <h2 className="font-semibold">Protected replacement upload</h2>
        <p className="mt-1 text-sm text-muted">
          JPEG, PNG, WebP, GIF, MP4 or WebM up to 8 MB. New objects use versioned paths.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="media-destination">Destination</Label>
          <Select
            id="media-destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="profile">Profile cover image</option>
            {projectCovers.map((item) => (
              <option key={item.id} value={`project:${item.id}`}>
                Project cover · {item.label}
              </option>
            ))}
            {media.map((item) => (
              <option key={item.id} value={item.id}>
                Media · {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="media-file">Media file</Label>
          <Input
            id="media-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            onChange={(event) => chooseFile(event.target.files?.[0] || null)}
          />
        </div>
      </div>
      {preview ? (
        <div className="overflow-hidden rounded-xl border border-line bg-slate-100 p-3">
          {file?.type.startsWith("video/") ? (
            <video src={preview} controls className="max-h-72 w-full object-contain" />
          ) : (
            <Image
              src={preview}
              alt="Selected upload preview"
              width={960}
              height={540}
              unoptimized
              className="max-h-72 w-full object-contain"
            />
          )}
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        <Button type="button" onClick={upload} disabled={!file || progress === "uploading"}>
          {progress === "uploading" ? "Publishing…" : "Publish replacement"}
        </Button>
        {message ? (
          <p
            role="status"
            className={progress === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
