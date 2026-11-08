import "server-only";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { z } from "zod";
import { ExamSchema } from "@/lib/exam-schema";

export const runtime = "nodejs";
export const maxDuration = 30;

const ExportSchema = z.object({
  exam: ExamSchema,
  meta: z.object({
    subjectLabel: z.string(),
    gradeLabel: z.string(),
    topic: z.string(),
    difficultyLabel: z.string(),
  }),
  withAnswerKey: z.boolean().default(true),
  withSolutions: z.boolean().default(false),
});

const OPTION_LETTERS = ["A", "B", "C", "D"];

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true })],
  });
}

function para(text: string, opts: { bold?: boolean; italics?: boolean } = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })],
  });
}

function labeled(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });
}

export async function POST(req: Request) {
  let body: z.infer<typeof ExportSchema>;
  try {
    body = ExportSchema.parse(await req.json());
  } catch {
    return new Response("Geçersiz istek gövdesi.", { status: 400 });
  }

  const { exam, meta, withAnswerKey, withSolutions } = body;
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: exam.title, bold: true })],
    }),
  );

  children.push(labeled("Ders", meta.subjectLabel));
  children.push(labeled("Sınıf", meta.gradeLabel));
  children.push(labeled("Konu", meta.topic));
  children.push(labeled("Zorluk", meta.difficultyLabel));

  if (exam.instructions) {
    children.push(heading("Yönerge"));
    children.push(para(exam.instructions, { italics: true }));
  }

  children.push(heading("Sorular"));
  exam.questions.forEach((q, i) => {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: `${i + 1}. ${q.stem}`, bold: true })],
      }),
    );
    if (q.kind === "coktan-secmeli" && q.options) {
      q.options.forEach((opt, j) => {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            indent: { left: 400 },
            children: [
              new TextRun({ text: `${OPTION_LETTERS[j] ?? j + 1}) ${opt}` }),
            ],
          }),
        );
      });
    } else {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 400 },
          children: [new TextRun({ text: "Cevap: ______________________", italics: true })],
        }),
      );
    }
    if (withSolutions) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          indent: { left: 400 },
          children: [
            new TextRun({ text: "Çözüm: ", bold: true }),
            new TextRun({ text: q.solution, italics: true }),
          ],
        }),
      );
    }
  });

  if (withAnswerKey) {
    children.push(heading("Cevap Anahtarı"));
    exam.answerKey.forEach((a, i) => {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true }),
            new TextRun({ text: a }),
          ],
        }),
      );
    });
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
    },
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const bytes = new Uint8Array(buffer);
  const slug = meta.topic
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .toLowerCase() || "sinav";

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slug}.docx"`,
    },
  });
}
