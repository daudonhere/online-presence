import { randomUUID } from "crypto";
import { supabase } from "./supabase";

const ALLOWED_TYPES: Record<string, string[]> = {
  avatars: ["image/jpeg", "image/png"],
  obstacles: ["application/pdf", "image/jpeg", "image/png"],
  reports: ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

const MAX_SIZES: Record<string, number> = {
  avatars: 1 * 1024 * 1024,
  obstacles: 1 * 1024 * 1024,
  reports: 10 * 1024 * 1024,
};

const MAGIC_BYTES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

export class UploadError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "UploadError";
  }
}

function detectMime(buffer: Buffer): string | null {
  for (const { mime, bytes } of MAGIC_BYTES) {
    if (buffer.length >= bytes.length && bytes.every((b, i) => buffer[i] === b)) {
      return mime;
    }
  }
  return null;
}

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export async function saveFile(
  file: File,
  folder: "avatars" | "obstacles" | "reports"
): Promise<string> {
  const allowed = ALLOWED_TYPES[folder];
  const maxSize = MAX_SIZES[folder];

  if (!allowed || !maxSize) {
    throw new UploadError("Invalid upload folder", 500);
  }

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    throw new UploadError(`Ukuran file maksimal ${maxMB} MB`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectMime(buffer);

  if (!detectedMime || !allowed.includes(detectedMime)) {
    throw new UploadError(
      `Format file tidak diizinkan. Format yang diperbolehkan: ${allowed
        .map((a) => a.split("/")[1])
        .join(", ")}`
    );
  }

  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  };

  const ext = mimeToExt[detectedMime] || getExtension(file.name);
  const filename = `${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(folder)
    .upload(filename, buffer, { contentType: detectedMime });

  if (error) {
    throw new UploadError("Gagal upload file ke server", 500);
  }

  const { data } = supabase.storage.from(folder).getPublicUrl(filename);

  return data.publicUrl;
}
