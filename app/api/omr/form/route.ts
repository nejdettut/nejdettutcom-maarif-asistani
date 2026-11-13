// Modül 3 (OMR): standart A4 optik okuma formu üretici.
// Öğrenci PDF'i çıktı alır, kalemle kurşun boyar; öğretmen telefonla
// fotoğraflar; /api/omr/okut puanlar.
import "server-only";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

type Options = { count: number; title: string; sinif: string };

function parseOptions(url: URL): Options | string {
  const count = Math.min(50, Math.max(5, parseInt(url.searchParams.get("count") ?? "20", 10)));
  if (Number.isNaN(count)) return "count 5–50 arası tam sayı olmalı.";
  const title = (url.searchParams.get("title") ?? "Sınav Formu").slice(0, 80);
  const sinif = (url.searchParams.get("sinif") ?? "").slice(0, 40);
  return { count, title, sinif };
}

// Letter grid: A B C D E — five options per question, 1-based row numbers.
const CHOICES = ["A", "B", "C", "D", "E"] as const;

export async function GET(req: Request) {
  const limited = await rateLimit({
    action: "omr-form",
    windowMs: 60 * 60 * 1000,
    max: 30,
  });
  if (!limited.ok) {
    return json(
      { error: "Saatte en fazla 30 form üretilebilir. Lütfen biraz sonra tekrar dene." },
      429,
    );
  }

  const parsed = parseOptions(new URL(req.url));
  if (typeof parsed === "string") return json({ error: parsed }, 400);
  const { count, title, sinif } = parsed;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4 in points (portrait)
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  const ink = rgb(0.11, 0.11, 0.1);

  // Fiducial markers — three filled corner squares (TL, TR, BL) so the
  // scanner finds the sheet orientation reliably. BR is left empty on
  // purpose; it acts as the odd-one-out marker.
  const fiducialSize = 20;
  const drawFiducial = (x: number, y: number) =>
    page.drawRectangle({
      x,
      y,
      width: fiducialSize,
      height: fiducialSize,
      color: ink,
    });
  drawFiducial(30, 792); // top-left
  drawFiducial(545, 792); // top-right
  drawFiducial(30, 30); // bottom-left

  // Header
  page.drawText(title, {
    x: 70,
    y: 800,
    size: 18,
    font,
    color: ink,
  });
  if (sinif) {
    page.drawText(`Sınıf: ${sinif}`, {
      x: 70,
      y: 775,
      size: 11,
      font: fontRegular,
      color: ink,
    });
  }

  // Student info strip
  const stripY = 740;
  page.drawText("Ad Soyad:", { x: 60, y: stripY, size: 11, font: fontRegular, color: ink });
  page.drawLine({
    start: { x: 120, y: stripY - 2 },
    end: { x: 340, y: stripY - 2 },
    thickness: 0.7,
    color: ink,
  });
  page.drawText("Numara:", { x: 360, y: stripY, size: 11, font: fontRegular, color: ink });
  page.drawLine({
    start: { x: 410, y: stripY - 2 },
    end: { x: 540, y: stripY - 2 },
    thickness: 0.7,
    color: ink,
  });

  // Instructions
  page.drawText(
    "Dikkat: Yalnızca tek bir seçeneği tamamen doldurunuz. Siliyorsanız temiz silin.",
    { x: 60, y: 716, size: 9, font: fontRegular, color: ink },
  );

  // Answer grid
  //   Columns: two columns of questions when count > 25, else single column.
  const twoCol = count > 25;
  const colCount = twoCol ? 2 : 1;
  const perCol = Math.ceil(count / colCount);
  const rowH = Math.min(26, (700 - 70) / perCol);
  const bubbleR = 7.5;
  const bubbleGap = 28;
  const leftMargin = 70;
  const colWidth = 240;

  // Header letters A B C D E over each column
  for (let col = 0; col < colCount; col++) {
    const colX = leftMargin + col * colWidth;
    CHOICES.forEach((choice, idx) => {
      page.drawText(choice, {
        x: colX + 40 + idx * bubbleGap - 3,
        y: 700,
        size: 10,
        font,
        color: ink,
      });
    });
  }

  for (let i = 0; i < count; i++) {
    const col = twoCol && i >= perCol ? 1 : 0;
    const row = twoCol && i >= perCol ? i - perCol : i;
    const colX = leftMargin + col * colWidth;
    const y = 680 - row * rowH;

    page.drawText(String(i + 1).padStart(2, "0"), {
      x: colX,
      y,
      size: 11,
      font,
      color: ink,
    });

    for (let c = 0; c < CHOICES.length; c++) {
      page.drawCircle({
        x: colX + 40 + c * bubbleGap,
        y: y + 3,
        size: bubbleR,
        borderColor: ink,
        borderWidth: 1.0,
      });
    }
  }

  // Footer
  page.drawText(
    "Zaman Robotu · AI Maarif Asistanı — nejdettut.com/projeler/maarif-suite",
    { x: 60, y: 48, size: 8, font: fontRegular, color: ink },
  );

  const bytes = await pdf.save();
  const slug = title
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "omr-formu";

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${slug}-${count}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
