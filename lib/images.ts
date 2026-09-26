import imageCompression from "browser-image-compression";

export async function compressProjectCover(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = 16 / 9;
    const cropWidth = bitmap.width / bitmap.height > ratio ? bitmap.height * ratio : bitmap.width;
    const cropHeight = bitmap.width / bitmap.height > ratio ? bitmap.height : bitmap.width / ratio;
    const sx = (bitmap.width - cropWidth) / 2;
    const sy = (bitmap.height - cropHeight) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser ini tidak dapat memproses gambar.");
    context.drawImage(bitmap, sx, sy, cropWidth, cropHeight, 0, 0, 1280, 720);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Gambar gagal diproses.")), "image/webp", .88));
    const cropped = new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
    return imageCompression(cropped, { maxSizeMB: .18, maxWidthOrHeight: 1280, useWebWorker: true });
  } finally {
    bitmap.close();
  }
}
