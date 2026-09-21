// Compresses an image file using the Canvas API.
// Only runs in the browser (Canvas API).

const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.6;
const COMPRESS_THRESHOLD = 200 * 1024; // 200 KB — skip already-small files
const TARGET_SIZE = 250 * 1024; // 250 KB — second pass threshold

function compressBlob(blobUrl: string, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported.")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Compression failed.")),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to load image for compression."));
    };
    img.src = blobUrl;
  });
}

export async function compressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_THRESHOLD) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "");

  const firstBlob = await compressBlob(URL.createObjectURL(file), MAX_DIMENSION, JPEG_QUALITY);
  if (firstBlob.size <= TARGET_SIZE) {
    return new File([firstBlob], `${baseName}.jpg`, { type: "image/jpeg" });
  }

  const secondBlob = await compressBlob(URL.createObjectURL(firstBlob), 800, 0.5);
  if (secondBlob.size <= TARGET_SIZE) {
    return new File([secondBlob], `${baseName}.jpg`, { type: "image/jpeg" });
  }

  // Third pass: guaranteed ceiling — 600px/0.4 covers even very complex textures
  const thirdBlob = await compressBlob(URL.createObjectURL(secondBlob), 600, 0.4);
  return new File([thirdBlob], `${baseName}.jpg`, { type: "image/jpeg" });
}
