"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { Textarea } from "@/shared/components/ui/Textarea";
import { Select } from "@/shared/components/ui/Select";
import { portfolioIconNames } from "@/contracts/portfolio-presentation.contract";

type MediaOwner =
  | { type: "profile" }
  | { type: "media-block"; id: string }
  | { type: "project-cover"; id: string };

const ALL_MEDIA_TYPES = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export function MediaUploader({
  owner,
  source,
  type,
  title,
}: {
  owner: MediaOwner;
  source: string | null;
  type: "IMAGE" | "VIDEO";
  title: string;
}) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<string | null>(null);

  const [progress, setProgress] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const [message, setMessage] = useState("");

  const acceptsImagesOnly = owner.type === "profile" || owner.type === "project-cover";

  useEffect(
    () => () => {
      if (preview) {URL.revokeObjectURL(preview);}
    },
    [preview],
  );

  function chooseFile(selected: File | null) {
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : null);
    setProgress("idle");
    setMessage("");
  }

  async function upload() {
    if (!file) {return;}

    setProgress("uploading");
    const body = new FormData();

    body.set("file", file);
    body.set("owner", JSON.stringify(owner));

    try {
      const response = await fetch("/api/admin/media", { method: "POST", body });

      const payload = (await response.json()) as { cleanupWarning?: boolean; message?: string };

      if (!response.ok) {throw new Error(payload.message);}

      setProgress("success");
      setMessage(payload.cleanupWarning ? "Published. The previous object needs manual cleanup." : "Published.");
      router.refresh();
    } catch {
      setProgress("error");
      setMessage("The media replacement could not be published. The existing media is unchanged.");
    }
  }

  const previewSource = preview ?? source;

  const previewType = preview ? (file?.type.startsWith("video/") ? "VIDEO" : "IMAGE") : type;

  return (
    <section className="space-y-3 rounded-xl border border-line bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted">
          {acceptsImagesOnly ? "JPEG, PNG, WebP or GIF" : "JPEG, PNG, WebP, GIF, MP4 or WebM"} up to 8 MB.
        </p>
      </div>
      {previewSource ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-white">
          {previewType === "VIDEO" ? (
            <video className="size-full object-contain" controls src={previewSource} />
          ) : preview ? (
            <Image alt="Selected upload preview" className="object-contain" fill sizes="(max-width: 768px) 100vw, 42rem" src={previewSource} unoptimized />
          ) : (
            <Image alt={`${title} preview`} className="object-contain" fill sizes="(max-width: 768px) 100vw, 42rem" src={previewSource} />
          )}
        </div>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`media-file-${owner.type}-${"id" in owner ? owner.id : "profile"}`}>Replacement file</Label>
          <Input id={`media-file-${owner.type}-${"id" in owner ? owner.id : "profile"}`} type="file" accept={acceptsImagesOnly ? IMAGE_TYPES : ALL_MEDIA_TYPES} onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
        </div>
        <Button type="button" onClick={upload} disabled={!file || progress === "uploading"}>
          {progress === "uploading" ? "Publishing…" : "Publish replacement"}
        </Button>
      </div>
      {message ? <p role="status" className={progress === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{message}</p> : null}
    </section>
  );
}

export function NewMediaBlockUploader() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);

  const [progress, setProgress] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const [message, setMessage] = useState("");

  async function create(form: FormData) {
    if (!file) {return;}

    setProgress("uploading");
    form.set("file", file);
    form.set(
      "metadata",
      JSON.stringify({
        label: String(form.get("label") ?? ""),
        altText: String(form.get("altText") ?? ""),
        copy: String(form.get("copy") ?? "") || null,
        iconName: String(form.get("iconName") ?? "") || null,
        colour: null,
      }),
    );
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: form });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {throw new Error(payload.message);}

      setProgress("success");
      setMessage("Managed media created.");
      router.refresh();
    } catch {
      setProgress("error");
      setMessage("The media could not be created.");
    }
  }

  return (
    <form action={create} className="space-y-4 rounded-2xl border border-line bg-white p-5">
      <div>
        <h2 className="font-semibold">New managed media</h2>
        <p className="mt-1 text-sm text-muted">Upload the file; its stored media type and canonical source are set by the protected backend.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="new-media-label">Label</Label><Input id="new-media-label" name="label" required /></div>
        <div className="space-y-1.5"><Label htmlFor="new-media-alt">Alternative text</Label><Input id="new-media-alt" name="altText" required /></div>
        <div className="space-y-1.5"><Label htmlFor="new-media-file">File</Label><Input id="new-media-file" type="file" accept={ALL_MEDIA_TYPES} required onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
        <div className="space-y-1.5"><Label htmlFor="new-media-icon">Approved icon</Label><Select id="new-media-icon" name="iconName" defaultValue=""><option value="">None</option>{portfolioIconNames.map((name) => <option key={name}>{name}</option>)}</Select></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="new-media-copy">Supporting copy</Label><Textarea id="new-media-copy" name="copy" /></div>
      <Button type="submit" disabled={!file || progress === "uploading"}>{progress === "uploading" ? "Publishing…" : "Create managed media"}</Button>
      {message ? <p role="status" className={progress === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{message}</p> : null}
    </form>
  );
}
