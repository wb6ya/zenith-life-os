import { z } from "zod";

// 1. قوانين الأهداف (Milestones)
// العنوان: نص، لا يقل عن 3 حروف ولا يزيد عن 100
// الخطوات: نص طويل (سنقوم بتقسيمه لاحقاً)
export const milestoneSchema = z.object({
  title: z.string()
    .min(3, { message: "العنوان قصير جداً (3 حروف على الأقل)" })
    .max(100, { message: "العنوان طويل جداً" })
    .trim(), // يحذف المسافات الزائدة
  steps: z.string()
    .min(5, { message: "يجب إضافة خطوات للتنفيذ" })
    .max(5000, { message: "الخطوات كثيرة جداً" }),
});

// 2. قوانين المهام (Tasks)
export const taskSchema = z.object({
  title: z.string().min(1, "اسم المهمة مطلوب").max(200),
  category: z.enum(['fitness', 'project', 'reading', 'learning', 'general', 'work']).optional(),
  xpReward: z.coerce.number().min(10).max(1000).default(50), // coerce يحول النص لرقم
});

// 3. قوانين المشاريع (Projects)
export const projectSchema = z.object({
  name: z.string().min(2, "اسم المشروع مطلوب"),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived', 'idea']).default('idea'),
  progress: z.coerce.number().min(0).max(100).default(0),
});

// 4. قوانين تحديث البروفايل (Profile)
export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(), // بايو قصير
  // نمنع المستخدم من تعديل الـ XP أو Level يدوياً (هذه مسؤولية النظام)
});