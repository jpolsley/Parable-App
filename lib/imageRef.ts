// A reference picture for Diana: shrunk to a JPEG the model can read, plus its main colors
// measured here (models are good at style, less exact about hex values).

export interface ImageReference {
  image: string; // base64 JPEG, no data: prefix
  preview: string; // data URL for the thumbnail
  colors: string[]; // most common first
}

const MAX_SIDE = 1024;

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That picture couldn't be opened here. Try a PNG or JPG (a screenshot works)."));
    img.src = url;
  });

const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

// Count colors in coarse buckets, then keep the common ones that are visibly different from each other.
const measureColors = (data: Uint8ClampedArray, limit = 6) => {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 16) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b;
    buckets.set(key, e);
  }
  const sorted = [...buckets.values()].sort((a, b) => b.n - a.n).map((e) => [e.r / e.n, e.g / e.n, e.b / e.n].map(Math.round));
  const picked: number[][] = [];
  for (const c of sorted) {
    if (picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 48)) picked.push(c);
    if (picked.length >= limit) break;
  }
  return picked.map(([r, g, b]) => toHex(r, g, b));
};

export const readReference = async (file: File): Promise<ImageReference> => {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("This browser couldn't read the picture.");
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const preview = canvas.toDataURL('image/jpeg', 0.85);
  return {
    image: preview.split(',')[1],
    preview,
    colors: measureColors(ctx.getImageData(0, 0, canvas.width, canvas.height).data),
  };
};
