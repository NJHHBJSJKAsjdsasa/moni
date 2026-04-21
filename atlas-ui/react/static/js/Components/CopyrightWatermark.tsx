// atlas-ui/react/static/js/Components/CopyrightWatermark.tsx

export interface CopyrightWatermarkOptions {
  imageWidth: number;
  imageHeight: number;
  startYear?: number;
  companyName?: string;
  opacity?: number;
  fontSize?: number;
}

export const addCopyrightWatermark = (ctx: CanvasRenderingContext2D, options: CopyrightWatermarkOptions) => {
  const { imageWidth, imageHeight, startYear = 2023, companyName = "Banshee", opacity = 0.5, fontSize } = options;

  const currentYear = new Date().getFullYear();
  const yearRange = currentYear === startYear ? `${startYear}` : `${startYear}-${currentYear}`;
  const copyrightText = `The Atlas © Copyright ${companyName} • ${yearRange}`;

  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  const responsiveFontSize = fontSize || Math.floor(imageWidth / 80);
  ctx.font = `${responsiveFontSize}px Arial`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";

  const margin = Math.floor(imageWidth / 100);
  ctx.fillText(copyrightText, margin, imageHeight - margin);
};
