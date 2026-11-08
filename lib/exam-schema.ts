import { z } from "zod";

export const SUBJECTS = [
  "matematik",
  "fen-bilimleri",
  "fizik",
  "kimya",
  "biyoloji",
  "turkce",
  "edebiyat",
  "sosyal-bilgiler",
  "tarih",
  "cografya",
  "ingilizce",
  "bilisim",
  "din-kultur",
  "diger",
] as const;

export const SUBJECT_LABELS: Record<(typeof SUBJECTS)[number], string> = {
  matematik: "Matematik",
  "fen-bilimleri": "Fen Bilimleri",
  fizik: "Fizik",
  kimya: "Kimya",
  biyoloji: "Biyoloji",
  turkce: "Türkçe",
  edebiyat: "Edebiyat",
  "sosyal-bilgiler": "Sosyal Bilgiler",
  tarih: "Tarih",
  cografya: "Coğrafya",
  ingilizce: "İngilizce",
  bilisim: "Bilişim Teknolojileri",
  "din-kultur": "Din Kültürü ve Ahlak Bilgisi",
  diger: "Diğer",
};

export const GRADE_LEVELS = [
  "ilkokul-1",
  "ilkokul-2",
  "ilkokul-3",
  "ilkokul-4",
  "ortaokul-5",
  "ortaokul-6",
  "ortaokul-7",
  "ortaokul-8",
  "lise-9",
  "lise-10",
  "lise-11",
  "lise-12",
] as const;

export const GRADE_LABELS: Record<(typeof GRADE_LEVELS)[number], string> = {
  "ilkokul-1": "1. Sınıf (İlkokul)",
  "ilkokul-2": "2. Sınıf (İlkokul)",
  "ilkokul-3": "3. Sınıf (İlkokul)",
  "ilkokul-4": "4. Sınıf (İlkokul)",
  "ortaokul-5": "5. Sınıf (Ortaokul)",
  "ortaokul-6": "6. Sınıf (Ortaokul)",
  "ortaokul-7": "7. Sınıf (Ortaokul)",
  "ortaokul-8": "8. Sınıf (Ortaokul)",
  "lise-9": "9. Sınıf (Lise)",
  "lise-10": "10. Sınıf (Lise)",
  "lise-11": "11. Sınıf (Lise)",
  "lise-12": "12. Sınıf (Lise)",
};

export const DIFFICULTIES = ["kolay", "orta", "zor", "karisik"] as const;

export const DIFFICULTY_LABELS: Record<(typeof DIFFICULTIES)[number], string> = {
  kolay: "Kolay",
  orta: "Orta",
  zor: "Zor",
  karisik: "Karışık (kolay + orta + zor)",
};

export const QUESTION_TYPES = ["coktan-secmeli", "acik-uclu", "karisik"] as const;

export const QUESTION_TYPE_LABELS: Record<
  (typeof QUESTION_TYPES)[number],
  string
> = {
  "coktan-secmeli": "Çoktan seçmeli (4 şık)",
  "acik-uclu": "Açık uçlu",
  karisik: "Karışık",
};

export const ExamRequestSchema = z.object({
  subject: z.enum(SUBJECTS),
  customSubject: z.string().max(80).optional(),
  grade: z.enum(GRADE_LEVELS),
  topic: z.string().min(3).max(200),
  difficulty: z.enum(DIFFICULTIES),
  questionType: z.enum(QUESTION_TYPES),
  count: z.number().int().min(3).max(25),
  learningObjectives: z.string().max(400).optional(),
});

export const QuestionSchema = z.object({
  kind: z.enum(["coktan-secmeli", "acik-uclu"]),
  stem: z.string(),
  options: z.array(z.string()).max(4).optional(),
  correctIndex: z.number().int().min(0).max(3).optional(),
  expectedAnswer: z.string().optional(),
  solution: z.string(),
  difficulty: z.enum(["kolay", "orta", "zor"]),
  bloomLevel: z.enum([
    "hatirla",
    "anla",
    "uygula",
    "analiz",
    "degerlendir",
    "yarat",
  ]),
});

export const ExamSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  questions: z.array(QuestionSchema).min(3).max(25),
  answerKey: z.array(z.string()),
});

export type Exam = z.infer<typeof ExamSchema>;
export type ExamRequest = z.infer<typeof ExamRequestSchema>;
