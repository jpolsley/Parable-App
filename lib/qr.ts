import QRCode from 'qrcode';

// Build a QR code as an SVG path string synchronously (no canvas), so it prints crisply.
export const qrPath = (text: string): { size: number; d: string } | null => {
  try {
    const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const { size } = modules;
    let d = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (modules.get(r, c)) d += `M${c} ${r}h1v1h-1z`;
      }
    }
    return { size, d };
  } catch {
    return null;
  }
};
