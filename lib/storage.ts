import { supabase } from "@/lib/supabase";

const BUCKET = "images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is too large. Max size is 5 MB.`);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `"${file.name}" is not a supported format. Use JPEG, PNG, WebP, or GIF.`
    );
  }
}

function storagePath(url: string): string {
  // Public URL format: .../storage/v1/object/public/images/{path}
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) throw new Error("Cannot parse storage path from URL.");
  return decodeURIComponent(url.slice(idx + marker.length));
}

// Returns the public URL for a storage path without making a network request.
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Uploads a file and returns its public URL.
export async function uploadImage(file: File, userId: string): Promise<string> {
  validateFile(file);

  const ext = file.name.split(".").pop() ?? "jpg";
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${userId}/${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) throw new Error(error.message);

  return getPublicUrl(path);
}

// Deletes an image given its public URL.
export async function deleteImage(url: string): Promise<void> {
  const path = storagePath(url);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}
