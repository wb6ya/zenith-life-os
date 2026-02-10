import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "رابط قاعدة البيانات مفقود!"),
  NEXTAUTH_SECRET: z.string().min(1, "مفتاح التشفير مفقود!"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // أضف أي مفاتيح أخرى هنا
});

// محاولة الفحص
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("❌ أخطاء في متغيرات البيئة:", env.error.flatten().fieldErrors);
  throw new Error("توقف! ملف .env ناقص.");
}

export const ENV = env.data;