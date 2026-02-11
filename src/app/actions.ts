"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { sendDiscordMessage } from "@/lib/discord";
import { z } from "zod";
import createDOMPurify from "dompurify";

const DOMPurify = createDOMPurify(window as unknown as any);
import translate from '@iamtraction/google-translate';

// ✅ استيراد Rate Limiter (الحماية من السبام)
import { rateLimit } from "@/lib/rate-limit";

// Models
import User from "@/models/User";
import Project from "@/models/Project";
import Workout from "@/models/Workout";
import Resource from "@/models/Resource";
import WorkoutPlan from "@/models/WorkoutPlan";
import Course from "@/models/Course";
import Entertainment from "@/models/Entertainment";
import Task from "@/models/Task";
import Milestone from "@/models/Milestone";

// ==========================================
// 🛡️ SANITIZATION & HELPERS
// ==========================================
const sanitize = (val: string) => DOMPurify.sanitize(val.trim());

// ==========================================
// 🛡️ Zod Schemas
// ==========================================

const milestoneSchema = z.object({
  title: z.string().min(2).max(100).transform(sanitize),
  steps: z.string().transform(sanitize),
});

const projectSchema = z.object({
  title: z.string().min(2, "عنوان المشروع مطلوب").max(100).transform(sanitize),
  description: z.string().max(1000).optional().transform(val => val ? sanitize(val) : ""),
  link: z.string().max(500).optional().transform(val => val ? sanitize(val) : ""),
  tags: z.string().max(200).optional().transform(val => val ? sanitize(val) : ""),
});

const workoutPlanSchema = z.object({
  title: z.string().min(2, "عنوان الخطة مطلوب").max(100).transform(sanitize),
  description: z.string().max(500).optional().transform(val => val ? sanitize(val) : ""),
});

const resourceSchema = z.object({
  title: z.string().min(2).max(150).transform(sanitize),
  description: z.string().max(1000).optional().transform(val => val ? sanitize(val) : ""),
  link: z.string().max(500).optional().transform(val => val ? sanitize(val) : ""),
  totalUnits: z.coerce.number().min(1).max(10000),
  image: z.string().optional().transform(val => val ? sanitize(val) : ""),
});

const courseSchema = z.object({
  title: z.string().min(2).max(150).transform(sanitize),
  description: z.string().max(1000).optional().transform(val => val ? sanitize(val) : ""),
  link: z.string().max(500).optional().transform(val => val ? sanitize(val) : ""),
  image: z.string().optional().transform(val => val ? sanitize(val) : ""),
});

const profileSchema = z.object({
  name: z.string().min(2).max(50).transform(sanitize),
  image: z.string().optional().transform(val => val ? sanitize(val) : ""),
});

const entertainmentSchema = z.object({
  apiId: z.string().transform(sanitize),
  title: z.string().transform(sanitize),
  type: z.string().transform(sanitize),
  image: z.string().optional().transform(val => val ? sanitize(val) : ""),
  rating: z.string().optional().transform(val => val ? sanitize(val) : ""),
  year: z.string().optional().transform(val => val ? sanitize(val) : ""),
  status: z.string().optional().transform(val => val ? sanitize(val) : "")
});

// ==========================================
// 🔐 Authentication & Helpers
// ==========================================

export async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return null;

  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  return user;
}

async function translateToAr(text: string) {
  if (!text || text.trim() === "") return "";
  try {
    const res = await translate(text, { to: 'ar' });
    return res.text;
  } catch (e) {
    console.error("Translation Error:", e);
    return text;
  }
}

export async function addXP(amount: number) {
  const user = await getUser();
  if (!user) return;

  user.xp += amount;

  while (user.xp >= user.xpRequired) {
    user.xp -= user.xpRequired;
    user.level += 1;
    user.xpRequired = Math.floor(user.xpRequired * 1.5);
  }

  await user.save();
  revalidatePath("/");
}

// --- Mock Data ---
const getMockResults = (query: string, type: string, lang: string) => {
  const isAr = lang === 'ar';
  const titles = isAr
    ? [`الأسطورة: ${query}`, `عودة ${query}`, `حرب ${query}`]
    : [`The Legend of ${query}`, `Return of ${query}`, `War of ${query}`];

  return titles.map((t, i) => ({
    apiId: `mock-${type}-${i}-${Math.random()}`,
    title: t,
    image: `https://placehold.co/400x600/101010/FFF.png?text=${type.toUpperCase()}+${i + 1}`,
    rating: (Math.random() * 5 + 5).toFixed(1) + "/10",
    year: "2025",
    type: type
  }));
};

const getMockDetails = (type: string, lang: string) => {
  const isAr = lang === 'ar';
  return {
    description: isAr
      ? "هذا نص تجريبي لوصف العنصر. البيانات الحقيقية تتطلب مفاتيح API."
      : "This is a mock description because no API key was provided.",
    genres: isAr ? "أكشن، مغامرة" : "Action, Adventure",
    trailer: "https://www.youtube.com/embed/jfKfPfyJRdk",
    backdrop: "https://images.unsplash.com/photo-1536440136628-849c177e76a1"
  };
};

// ==========================================
// 🚀 Projects System
// ==========================================

export async function createProject(formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { success: false, message: "User not found" };

    // 🚦 Rate Limit: Max 5 projects per minute
    const allow = rateLimit(`create-project-${user._id}`, 5, 60000);
    if (!allow) return { success: false, message: "Please wait before creating another project." };

    const rawData = {
      title: formData.get("title"),
      description: formData.get("description"),
      link: formData.get("link"),
      tags: formData.get("tags"),
    };

    const validation = projectSchema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, message: (validation.error as any).errors[0].message };
    }

    const { title, description, link, tags } = validation.data;

    await Project.create({
      userId: user._id,
      title,
      description,
      link,
      tags: tags ? tags.split(',') : [],
      xpReward: 500,
      status: 'active'
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, message: "Server Error" };
  }
}

export async function createNewProject(formData: FormData) {
  return createProject(formData);
}

export async function getActiveProjects() {
  try {
    const user = await getUser();
    if (!user) return { success: false, projects: [] };
    const projects = await Project.find({ userId: user._id, status: 'active' }).sort({ createdAt: -1 });
    return { success: true, projects: JSON.parse(JSON.stringify(projects)) };
  } catch (e) { return { success: false, projects: [] }; }
}

export async function shipProject(projectId: string, data: any) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    // Manual Sanitization for extra safety on complex object
    const safeTitle = data.finalTitle ? DOMPurify.sanitize(data.finalTitle) : undefined;
    const safeDesc = data.finalDescription ? DOMPurify.sanitize(data.finalDescription) : undefined;

    await Project.findByIdAndUpdate(projectId, {
      status: 'completed',
      completedAt: new Date(),
      title: safeTitle,
      description: safeDesc,
      githubLink: data.githubLink ? DOMPurify.sanitize(data.githubLink) : "",
      demoLink: data.demoLink ? DOMPurify.sanitize(data.demoLink) : "",
      image: data.image, // Images usually handled by URL validation or upload logic
    });

    await User.findByIdAndUpdate(user._id, { $inc: { xp: 500 } });

    revalidatePath("/projects");
    revalidatePath("/profile");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function deleteProject(id: string) {
  try {
    await Project.findByIdAndDelete(id);
    revalidatePath("/projects");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function setProjectFocus(projectId: string) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    await Project.updateMany({ userId: user._id }, { $set: { isFocus: false } });
    await Project.findByIdAndUpdate(projectId, { $set: { isFocus: true } });

    revalidatePath("/");
    revalidatePath("/projects");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function unsetProjectFocus(projectId: string) {
  try {
    await Project.findByIdAndUpdate(projectId, { $set: { isFocus: false } });
    revalidatePath("/");
    revalidatePath("/projects");
    return { success: true };
  } catch (e) { return { success: false }; }
}

// ==========================================
// 🏋️ Fitness System
// ==========================================

export async function logWorkout(planId: string, exercisesData: any) {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) return { success: false };

    // 🚦 Rate Limit: Logging workout shouldn't be spammed
    if (!rateLimit(`log-workout-${user._id}`, 10, 60000)) return { success: false, message: "Too fast!" };

    const plan = await WorkoutPlan.findOne({ _id: planId, userId: user._id });
    if (!plan) return { success: false, msg: "Plan not found" };

    const today = new Date();
    await Workout.create({
      userId: user._id,
      planId: plan._id,
      dayTitle: plan.days[plan.currentDayIndex].title,
      exercises: exercisesData,
      completedAt: today
    });

    const totalDays = plan.days.length;
    const currentIndex = plan.currentDayIndex;

    if (currentIndex >= totalDays - 1) {
      plan.isActive = false;
      plan.status = 'completed';
    } else {
      plan.currentDayIndex += 1;
    }

    await plan.save();

    user.xp = (user.xp || 0) + 150;
    await user.save();

    revalidatePath("/");
    return { success: true, planCompleted: !plan.isActive };

  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function resetDailyStatus() {
  try {
    const user = await getUser();
    if (!user) return { success: false };
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    await Workout.findOneAndDelete({ userId: user._id, completedAt: { $gte: startOfDay } });
    revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function createWorkoutPlan(title: string, description: string) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    // 🚦 Rate Limit
    if (!rateLimit(`create-plan-${user._id}`, 5, 60000)) return { success: false, message: "Please wait." };

    const validation = workoutPlanSchema.safeParse({ title, description });
    if (!validation.success) return { success: false, msg: (validation.error as any).errors[0].message };

    const activePlan = await WorkoutPlan.findOne({ userId: user._id, isActive: true });
    const newPlan = await WorkoutPlan.create({
      userId: user._id,
      title: validation.data.title,
      description: validation.data.description,
      isActive: !activePlan,
      days: []
    });
    revalidatePath("/fitness");
    return { success: true, planId: newPlan._id.toString() };
  } catch (error) { return { success: false }; }
}

export async function getWorkoutPlan(planId: string) {
  try {
    const user = await getUser();
    if (!user) return { success: false };
    const plan = await WorkoutPlan.findOne({ _id: planId, userId: user._id }).lean();
    if (!plan) return { success: false };
    return { success: true, plan: JSON.parse(JSON.stringify(plan)) };
  } catch (error) { return { success: false }; }
}

export async function saveDayToPlan(planId: string, dayData: any) {
  try {
    const user = await getUser();
    if (!user) return { success: false };
    const plan = await WorkoutPlan.findById(planId);
    if (!plan || plan.userId.toString() !== user._id.toString()) return { success: false, msg: "Unauthorized" };

    let cleanExercises: any[] = [];
    if (dayData.exercises && Array.isArray(dayData.exercises)) {
      cleanExercises = dayData.exercises
        .filter((ex: any) => ex.name && ex.name.trim() !== "")
        .map((ex: any) => ({
          name: DOMPurify.sanitize(ex.name),
          mediaUrl: DOMPurify.sanitize(ex.mediaUrl || ""),
          mediaType: ex.mediaType,
          sets: Number(ex.sets),
          reps: Number(ex.reps),
          restBetweenSets: Number(ex.restBetweenSets),
        }));
    }

    const newDayData = {
      dayNumber: dayData.dayNumber,
      title: DOMPurify.sanitize(dayData.title || ""),
      isRestDay: dayData.isRestDay,
      exercises: cleanExercises
    };

    const existingDayIndex = plan.days.findIndex((d: any) => d.dayNumber === dayData.dayNumber);
    if (existingDayIndex >= 0) { plan.days[existingDayIndex] = newDayData; }
    else { plan.days.push(newDayData); }

    plan.days.sort((a: any, b: any) => a.dayNumber - b.dayNumber);
    plan.markModified('days');
    await plan.save();
    revalidatePath(`/fitness/editor/${planId}`);
    return { success: true };
  } catch (error) { return { success: false, msg: "Server Error" }; }
}

export async function activateWorkoutPlan(planId: string) {
  try {
    const user = await getUser();
    if (!user) return { success: false };
    await WorkoutPlan.updateMany({ userId: user._id }, { isActive: false });
    await WorkoutPlan.findByIdAndUpdate(planId, { isActive: true, currentDayIndex: 0 });
    revalidatePath("/");
    revalidatePath("/fitness");
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function getActiveWorkoutSession() {
  try {
    const user = await getUser();
    if (!user) return { status: "error" };

    const plan = await WorkoutPlan.findOne({ userId: user._id, isActive: true });
    if (!plan || !plan.days || plan.days.length === 0) return { status: "no-plan" };

    const dayIndex = plan.currentDayIndex || 0;
    if (!plan.days[dayIndex]) return { status: "plan-completed" };

    const dayData = plan.days[dayIndex];
    return {
      status: "ready",
      data: JSON.parse(JSON.stringify(dayData)),
      planId: plan._id.toString(),
      dayIndex: dayIndex + 1
    };
  } catch (error) { return { status: "error" }; }
}

export async function completeDailySession(planId: string) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    await Workout.create({
      userId: user._id,
      planId: planId,
      completedAt: new Date(),
      xpEarned: 200,
    });

    await User.findByIdAndUpdate(user._id, {
      $inc: { xp: 200 },
      $set: { lastWorkout: new Date() }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    await Task.findOneAndUpdate(
      {
        userId: user._id,
        type: 'fitness',
        date: { $gte: todayStart }
      },
      { isCompleted: true },
      { upsert: true, new: true }
    );

    await checkAndIncrementStreak(user._id);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

async function checkAndIncrementStreak(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    userId: userId,
    date: { $gte: todayStart, $lte: todayEnd }
  });

  if (tasks.length === 0) return;

  const allCompleted = tasks.every((t: any) => t.isCompleted === true);

  if (allCompleted) {
    const user = await User.findById(userId);
    const lastStreakUpdate = new Date(user.lastStreakUpdate || 0);

    if (lastStreakUpdate < todayStart) {
      await User.findByIdAndUpdate(userId, {
        $inc: { currentStreak: 1 },
        $set: { lastStreakUpdate: new Date() }
      });
    }
  }
}

export async function getUserPlans() {
  try {
    const user = await getUser();
    if (!user) return { success: false, plans: [] };
    const plans = await WorkoutPlan.find({ userId: user._id }).sort({ createdAt: -1 });
    return { success: true, plans: JSON.parse(JSON.stringify(plans)) };
  } catch (error) { return { success: false, plans: [] }; }
}

export async function deleteWorkoutPlan(planId: string) {
  try {
    const user = await getUser();
    if (!user) return { success: false };
    await WorkoutPlan.findOneAndDelete({ _id: planId, userId: user._id });
    revalidatePath("/fitness");
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function fillRestDays(planId: string, dayNumbers: number[]) {
  try {
    const user = await getUser();
    if (!user) return { success: false };
    const plan = await WorkoutPlan.findById(planId);
    if (!plan) return { success: false };

    const restDays = dayNumbers.map(num => ({
      dayNumber: num,
      title: "استشفاء",
      isRestDay: true,
      exercises: []
    }));

    plan.days.push(...restDays);
    plan.days.sort((a: any, b: any) => a.dayNumber - b.dayNumber);
    plan.markModified('days');
    await plan.save();
    revalidatePath(`/fitness/editor/${planId}`);
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function runDailyDiagnostics() {
  try {
    const user = await getUser();
    if (!user) return { status: "error" };
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaysWorkout = await Workout.findOne({ userId: user._id, completedAt: { $gte: startOfDay } });

    if (todaysWorkout) {
      await sendDiscordMessage(`**كفو يا وحش ${user.name}!** \nتم تسجيل التمرين.`, 'info');
      return { status: "success" };
    } else {
      await sendDiscordMessage(`وينك يا بطل؟`, 'alert');
      return { status: "warning" };
    }
  } catch (error) { return { status: "error" }; }
}

// ==========================================
// 📚 Resources (Library)
// ==========================================

export async function addBook(formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    // 🚦 Rate Limit
    if (!rateLimit(`add-book-${user._id}`, 10, 60000)) return { success: false, message: "Limit reached." };

    const rawData = {
      title: formData.get("title"),
      description: formData.get("description"),
      link: formData.get("link"),
      totalUnits: formData.get("totalUnits"),
      image: formData.get("image"),
    };

    const validation = resourceSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: (validation.error as any).errors[0].message };

    const { title, description, link, totalUnits, image } = validation.data;

    await Resource.create({
      userId: user._id,
      title, description, image, link, totalUnits, status: 'idle'
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) { return { success: false, message: error.message }; }
}

export async function startReadingBook(bookId: string) {
  const user = await getUser();
  if (!user) return;
  await Resource.updateMany({ userId: user._id, status: 'reading' }, { status: 'idle' });
  await Resource.findByIdAndUpdate(bookId, { status: 'reading' });
  revalidatePath("/");
}

export async function updateProgress(resourceId: string, amount: number) {
  try {
    const user = await getUser();
    if (!user) return;
    const resource = await Resource.findOne({ _id: resourceId, userId: user._id });
    if (!resource) return;

    resource.completedUnits = Math.min(resource.completedUnits + amount, resource.totalUnits);
    if (resource.completedUnits >= resource.totalUnits && resource.status !== 'completed') {
      resource.status = 'completed';
      await addXP(300);
    }
    await resource.save();
    revalidatePath("/");
  } catch (error) { console.error(error); }
}

export async function finishBook(bookId: string) {
  const user = await getUser();
  if (!user) return;
  await Resource.findByIdAndUpdate(bookId, { status: 'completed', completedUnits: 9999 });
  await addXP(300);
  revalidatePath("/");
}

export async function resetBookStatus(bookId: string) {
  const user = await getUser();
  if (!user) return;
  await Resource.findByIdAndUpdate(bookId, { status: 'idle' });
  revalidatePath("/");
}

export async function deleteBook(bookId: string) {
  const user = await getUser();
  if (!user) return;
  await Resource.findOneAndDelete({ _id: bookId, userId: user._id });
  revalidatePath("/");
}

export async function updateResource(formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    // 🛡️ Zod Validation & Sanitization
    const rawData = {
      title: formData.get("title"),
      description: formData.get("description"),
      link: formData.get("link"),
      totalUnits: formData.get("totalUnits"),
      image: formData.get("image"),
    };
    const validation = resourceSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: (validation.error as any).errors[0].message };

    const id = formData.get("id") as string;

    await Resource.findOneAndUpdate(
      { _id: id, userId: user._id },
      validation.data // Safe data
    );
    revalidatePath("/");
    return { success: true };
  } catch (error: any) { return { success: false }; }
}

// ==========================================
// 🎓 Courses System
// ==========================================

export async function getCourses() {
  try {
    const user = await getUser();
    if (!user) return { success: false, courses: [] };
    const courses = await Course.find({ userId: user._id, status: { $ne: 'archived' } }).sort({ createdAt: -1 });
    return { success: true, courses: JSON.parse(JSON.stringify(courses)) };
  } catch (e) { return { success: false }; }
}

export async function createCourse(formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    // 🚦 Rate Limit
    if (!rateLimit(`create-course-${user._id}`, 5, 60000)) return { success: false, message: "Limit reached" };

    const rawData = {
      title: formData.get("title"),
      description: formData.get("description"),
      link: formData.get("link"),
      image: formData.get("image"),
    };
    const validation = courseSchema.safeParse(rawData);
    if (!validation.success) return { success: false, message: (validation.error as any).errors[0].message };

    await Course.create({
      userId: user._id,
      ...validation.data,
      status: 'idle'
    });
    revalidatePath("/");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function startCourse(id: string) {
  try {
    const user = await getUser();
    await Course.updateMany({ userId: user._id, status: 'in_progress' }, { status: 'idle' });
    await Course.findByIdAndUpdate(id, { status: 'in_progress' });
    revalidatePath("/");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function finishCourse(id: string, certData: any) {
  try {
    const user = await getUser();
    await Course.findByIdAndUpdate(id, {
      status: 'completed',
      completedAt: new Date(),
      certificateTitle: DOMPurify.sanitize(certData.title || ""),
      certificateLink: DOMPurify.sanitize(certData.link || ""),
      certificateImage: certData.image
    });
    await User.findByIdAndUpdate(user._id, { $inc: { xp: 1000 } });
    revalidatePath("/");
    revalidatePath("/profile");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function deleteCourse(id: string) {
  try {
    await Course.findByIdAndDelete(id);
    revalidatePath("/");
    return { success: true };
  } catch (e) { return { success: false }; }
}

// ==========================================
// 👤 User Profile Stats
// ==========================================

export async function getUserProfileStats() {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    // ... (جلب البيانات كما هو - لا تغيير في القراءة)
    const [workouts, books, projects, courses, ent] = await Promise.all([
      Workout.find({ userId: user._id }).sort({ completedAt: -1 }).limit(10).populate('planId', 'title').lean(),
      Resource.find({ userId: user._id, status: 'completed' }).sort({ updatedAt: -1 }).limit(5).lean(),
      Project.find({ userId: user._id, status: 'completed' }).sort({ completedAt: -1 }).limit(5).lean(),
      Course.find({ userId: user._id, status: 'completed' }).sort({ completedAt: -1 }).limit(5).lean(),
      Entertainment.find({ userId: user._id, status: 'completed' }).sort({ completedAt: -1 }).limit(5).lean(),
    ]);

    const combinedHistory = [
      ...workouts.map((w: any) => ({ id: w._id.toString(), title: w.planId?.title || "Workout", type: "workout", xp: w.xpEarned || 200, date: w.completedAt })),
      ...books.map((b: any) => ({ id: b._id.toString(), title: b.title, type: "book", xp: 300, date: b.updatedAt })),
      ...projects.map((p: any) => ({ id: p._id.toString(), title: p.title, type: "project", xp: 500, date: p.completedAt })),
      ...courses.map((c: any) => ({ id: c._id.toString(), title: c.title, type: "course", xp: 1000, date: c.completedAt })),
      ...ent.map((e: any) => ({ id: e._id.toString(), title: e.title, type: "entertainment", xp: 150, date: e.completedAt })),
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

    const [allWorkouts, allBooks, allProjects, allCourses] = await Promise.all([
      Workout.find({ userId: user._id }).select('completedAt').lean(),
      Resource.find({ userId: user._id, status: 'completed' }).select('updatedAt').lean(),
      Project.find({ userId: user._id, status: 'completed' }).select('completedAt').lean(),
      Course.find({ userId: user._id, status: 'completed' }).select('completedAt').lean(),
    ]);

    const activityDates = [
      ...allWorkouts.map((i: any) => i.completedAt),
      ...allBooks.map((i: any) => i.updatedAt),
      ...allProjects.map((i: any) => i.completedAt),
      ...allCourses.map((i: any) => i.completedAt),
    ].map(date => new Date(date).toISOString().split('T')[0]);

    const completedBooksList = await Resource.find({ userId: user._id, status: 'completed' }).sort({ updatedAt: -1 });
    const completedProjectsList = await Project.find({ userId: user._id, status: 'completed' }).sort({ updatedAt: -1 });
    const completedCoursesList = await Course.find({ userId: user._id, status: 'completed' }).sort({ completedAt: -1 });
    const totalWorkouts = await Workout.countDocuments({ userId: user._id });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
      const count = await Workout.countDocuments({ userId: user._id, completedAt: { $gte: d, $lt: nextDay } });
      last7Days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), count });
    }

    return {
      success: true,
      user: JSON.parse(JSON.stringify(user)),
      history: combinedHistory,
      activityMap: activityDates,
      completedBooks: JSON.parse(JSON.stringify(completedBooksList)),
      completedProjects: JSON.parse(JSON.stringify(completedProjectsList)),
      completedCourses: JSON.parse(JSON.stringify(completedCoursesList)),
      stats: { totalWorkouts, chartData: last7Days }
    };
  } catch (error) { return { success: false }; }
}

export async function updateUserProfile(formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    // 🚦 Rate Limit
    if (!rateLimit(`update-profile-${user._id}`, 3, 60000)) return { success: false, message: "Update limit reached" };

    const rawData = {
      name: formData.get("name"),
      image: formData.get("image"),
    };
    const validation = profileSchema.safeParse(rawData);
    if (!validation.success) return { success: false };

    const updateData: any = {};
    if (validation.data.name) updateData.name = validation.data.name;
    if (validation.data.image) updateData.image = validation.data.image;

    await User.findByIdAndUpdate(user._id, updateData);
    revalidatePath("/");
    revalidatePath("/profile");
    return { success: true };
  } catch (error) { return { success: false }; }
}

// ==========================================
// 🎮 Entertainment System
// ==========================================

export async function getEntertainment() {
  try {
    const user = await getUser();
    if (!user) return { success: false, items: [] };
    const items = await Entertainment.find({ userId: user._id }).sort({ createdAt: -1 });
    return { success: true, items: JSON.parse(JSON.stringify(items)) };
  } catch (e) { return { success: false, items: [] }; }
}

export async function searchEntertainment(query: string, type: 'game' | 'movie' | 'manga', lang: 'ar' | 'en') {
  try {
    const safeQuery = encodeURIComponent(query); // 🛡️ URL Encoding for Search

    if (type === 'manga') {
      const res = await fetch(`https://api.jikan.moe/v4/manga?q=${safeQuery}&limit=5`);
      const data = await res.json();
      return {
        success: true, results: data.data?.map((i: any) => ({
          apiId: i.mal_id.toString(),
          title: i.title_english || i.title,
          image: i.images.jpg.large_image_url,
          rating: i.score ? `${i.score}/10` : "N/A",
          shortDescription: i.synopsis ? i.synopsis.substring(0, 120) + "..." : "",
          year: i.published?.from ? new Date(i.published.from).getFullYear() : "N/A",
          type: 'manga'
        })) || []
      };
    }

    if (type === 'movie') {
      const API_KEY = process.env.TMDB_KEY;
      if (API_KEY) {
        const langParam = lang === 'ar' ? 'ar-SA' : 'en-US';
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${safeQuery}&language=${langParam}`);
        const data = await res.json();
        return {
          success: true, results: data.results?.filter((i: any) => i.media_type !== 'person').slice(0, 5).map((i: any) => ({
            apiId: i.id.toString(),
            title: i.title || i.name,
            image: i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : "",
            rating: i.vote_average ? `${i.vote_average.toFixed(1)}/10` : "N/A",
            shortDescription: i.overview ? i.overview.substring(0, 100) + "..." : "",
            year: (i.release_date || i.first_air_date || "").substring(0, 4),
            type: 'movie'
          })) || []
        };
      }
      return { success: true, results: getMockResults(query, 'movie', lang) };
    }

    if (type === 'game') {
      const API_KEY = process.env.RAWG_KEY;
      if (API_KEY) {
        const res = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${safeQuery}&page_size=5`);
        const data = await res.json();
        return {
          success: true, results: data.results?.map((i: any) => ({
            apiId: i.id.toString(),
            title: i.name,
            image: i.background_image,
            rating: i.rating ? `${i.rating}/5` : "N/A",
            shortDescription: i.genres?.map((g: any) => g.name).slice(0, 3).join(", ") || "",
            year: i.released ? i.released.substring(0, 4) : "N/A",
            type: 'game'
          })) || []
        };
      }
      return { success: true, results: getMockResults(query, 'game', lang) };
    }
    return { success: true, results: [] };
  } catch (e) { return { success: false, results: [] }; }
}

export async function getEntertainmentDetails(apiId: string, type: string, lang: 'ar' | 'en') {
  try {
    if (apiId.startsWith('mock')) return { success: true, details: getMockDetails(type, lang) };

    // ... (تم اختصار كود جلب التفاصيل هنا للحفاظ على السياق، ولكن في ملفك الحقيقي، أبقِ الكود الأصلي لجلب التفاصيل كما هو)
    // ... (Keep Original Fetch Logic Here)
    return { success: true, details: getMockDetails(type, lang) };

  } catch (e) {
    return { success: true, details: getMockDetails(type, lang) };
  }
}

export async function addEntertainment(data: any) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    // 🚦 Rate Limit
    if (!rateLimit(`add-ent-${user._id}`, 10, 60000)) return { success: false, message: "Please wait" };

    // 🛡️ Zod Validation & Sanitization
    const validation = entertainmentSchema.safeParse(data);
    if (!validation.success) return { success: false, message: "Invalid Data" };

    const exists = await Entertainment.findOne({ userId: user._id, apiId: data.apiId });
    if (exists) return { success: false, message: "Already added!" };

    await Entertainment.create({ userId: user._id, ...validation.data, status: 'pending' });
    revalidatePath("/");
    return { success: true };
  } catch (e) { return { success: false, message: "Error" }; }
}

export async function setActiveEntertainment(id: string, type: string) {
  try {
    const user = await getUser();
    await Entertainment.updateMany({ userId: user._id, type: type }, { status: 'pending' });
    await Entertainment.findByIdAndUpdate(id, { status: 'active' });
    revalidatePath("/");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function deleteEntertainment(id: string) {
  try { await Entertainment.findByIdAndDelete(id); revalidatePath("/"); return { success: true }; } catch (e) { return { success: false }; }
}

export async function pauseEntertainment() {
  try {
    const user = await getUser();
    await Entertainment.updateMany({ userId: user._id, status: 'active' }, { status: 'pending' });
    revalidatePath("/");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function finishEntertainment(id: string) {
  try {
    const user = await getUser();
    if (!user) return { success: false };
    await Entertainment.findByIdAndUpdate(id, { status: 'completed', completedAt: new Date() });
    await addXP(150);
    revalidatePath("/");
    return { success: true };
  } catch (e) { return { success: false }; }
}

// ==========================================
// 🧠 Smart Task System
// ==========================================

// ... (Task Banks - Same as before)
const DAILY_BANK = [
  { key: "task_plan_tomorrow", cat: "planning", xp: 50 },
  { key: "task_drink_water", cat: "health", xp: 30 },
  { key: "task_meditate", cat: "mindset", xp: 50 },
  { key: "task_clean_desk", cat: "system", xp: 40 },
  { key: "task_review_expenses", cat: "finance", xp: 60 },
  { key: "task_journal", cat: "mindset", xp: 50 },
  { key: "task_sleep_8h", cat: "health", xp: 100 },
  { key: "task_no_sugar", cat: "health", xp: 80 },
  { key: "task_walk_5k", cat: "fitness", xp: 100 },
  { key: "task_organize_files", cat: "system", xp: 40 }
];

const WEEKLY_BANK = [
  { key: "task_weekly_code_review", cat: "project", xp: 300 },
  { key: "task_long_cardio", cat: "fitness", xp: 300 },
  { key: "task_organize_workspace", cat: "system", xp: 200 },
  { key: "task_meal_prep", cat: "health", xp: 250 },
  { key: "task_review_finance_weekly", cat: "finance", xp: 300 },
  { key: "task_backup_data", cat: "system", xp: 200 },
  { key: "task_social_detox", cat: "mindset", xp: 400 },
  { key: "task_learn_algo", cat: "learning", xp: 350 },
  { key: "task_deep_clean", cat: "general", xp: 250 },
  { key: "task_update_cv", cat: "career", xp: 300 }
];

const MONTHLY_BANK = [
  { key: "task_update_portfolio", cat: "career", xp: 1000 },
  { key: "task_read_book", cat: "reading", xp: 1000 },
  { key: "task_review_goals", cat: "planning", xp: 500 },
  { key: "task_analyze_spending", cat: "finance", xp: 800 },
  { key: "task_complete_course", cat: "learning", xp: 1200 },
  { key: "task_body_check", cat: "health", xp: 600 },
  { key: "task_network", cat: "career", xp: 700 },
  { key: "task_declutter", cat: "system", xp: 500 },
  { key: "task_plan_strategy", cat: "planning", xp: 900 }
];

const PROJECT_ACTIONS = ["action_code_feature", "action_fix_bugs", "action_refactor", "action_write_docs", "action_design_ui", "action_test"];
const READING_ACTIONS = ["action_read_10_pages", "action_read_30_mins", "action_summarize"];

function getRandomTasks(bank: any[], count: number) {
  const shuffled = [...bank].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function getDashboardTasks() {
  try {
    const user = await getUser();
    if (!user) return { daily: [], weekly: [], monthly: [], yearlyStats: { daily: 0, weekly: 0, monthly: 0, goals: 0 } };

    const now = new Date();
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

    await Task.deleteMany({ userId: user._id, expiresAt: { $lt: now }, isCompleted: false, type: 'daily' });

    const dailyCount = await Task.countDocuments({ userId: user._id, type: 'daily', expiresAt: { $gt: now } });
    if (dailyCount === 0) await generateDailyTasks(user, endOfDay);

    const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    const weeklyCount = await Task.countDocuments({ userId: user._id, type: 'weekly', expiresAt: { $gt: now } });
    if (weeklyCount === 0) await generateWeeklyTasks(user, endOfWeek);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthlyCount = await Task.countDocuments({ userId: user._id, type: 'monthly', expiresAt: { $gt: now } });
    if (monthlyCount === 0) await generateMonthlyTasks(user, endOfMonth);

    const tasks = await Task.find({ userId: user._id, expiresAt: { $gt: now } }).sort({ isCompleted: 1, createdAt: -1 });

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const statsAggregation = await Task.aggregate([
      {
        $match: {
          userId: user._id,
          isCompleted: true,
          updatedAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);

    const goalsCount = await Milestone.countDocuments({ userId: user._id });

    const yearlyStats = {
      daily: statsAggregation.find(s => s._id === 'daily')?.count || 0,
      weekly: statsAggregation.find(s => s._id === 'weekly')?.count || 0,
      monthly: statsAggregation.find(s => s._id === 'monthly')?.count || 0,
      goals: goalsCount
    };

    return {
      daily: JSON.parse(JSON.stringify(tasks.filter((t: any) => t.type === 'daily'))),
      weekly: JSON.parse(JSON.stringify(tasks.filter((t: any) => t.type === 'weekly'))),
      monthly: JSON.parse(JSON.stringify(tasks.filter((t: any) => t.type === 'monthly'))),
      yearlyStats
    };

  } catch (e) {
    console.error(e);
    return { daily: [], weekly: [], monthly: [], yearlyStats: { daily: 0, weekly: 0, monthly: 0, goals: 0 } };
  }
}

async function generateDailyTasks(user: any, expiresAt: Date) {
  const newTasks = [];

  const activePlan = await WorkoutPlan.findOne({ userId: user._id, isActive: true });
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const workoutDoneToday = await Workout.findOne({ userId: user._id, completedAt: { $gte: startOfDay } });

  if (activePlan && !workoutDoneToday) {
    const dayTitle = activePlan.days[activePlan.currentDayIndex]?.title || `Day ${activePlan.currentDayIndex + 1}`;
    newTasks.push({
      userId: user._id,
      title: `action_workout:${dayTitle}`,
      type: 'daily',
      category: 'fitness',
      xpReward: 150,
      sourceId: activePlan._id,
      expiresAt
    });
  }

  const activeProjects = await Project.find({ userId: user._id, status: 'active' });
  if (activeProjects.length > 0) {
    const focusProject = activeProjects.find((p: any) => p.isFocus) || activeProjects[Math.floor(Math.random() * activeProjects.length)];
    const actionKey = PROJECT_ACTIONS[Math.floor(Math.random() * PROJECT_ACTIONS.length)];

    newTasks.push({
      userId: user._id,
      title: `${actionKey}:${focusProject.title}`,
      type: 'daily',
      category: 'project',
      xpReward: 100,
      sourceId: focusProject._id,
      expiresAt
    });
  }

  const readingBook = await Resource.findOne({ userId: user._id, status: 'reading' });
  if (readingBook) {
    const actionKey = READING_ACTIONS[Math.floor(Math.random() * READING_ACTIONS.length)];

    newTasks.push({
      userId: user._id,
      title: `${actionKey}:${readingBook.title}`,
      type: 'daily',
      category: 'reading',
      xpReward: 80,
      sourceId: readingBook._id,
      expiresAt
    });
  }

  const needed = Math.max(0, 3 - newTasks.length);
  if (needed > 0) {
    const randomBankTasks = getRandomTasks(DAILY_BANK, needed);
    randomBankTasks.forEach(t => {
      newTasks.push({
        userId: user._id,
        title: t.key,
        type: 'daily',
        category: t.cat,
        xpReward: t.xp,
        expiresAt
      });
    });
  }

  if (newTasks.length > 0) await Task.insertMany(newTasks);
}

async function generateWeeklyTasks(user: any, expiresAt: Date) {
  const selected = getRandomTasks(WEEKLY_BANK, 3);

  const tasks = selected.map(t => ({
    userId: user._id,
    title: t.key,
    type: 'weekly',
    category: t.cat,
    xpReward: t.xp,
    expiresAt
  }));

  await Task.insertMany(tasks);
}

async function generateMonthlyTasks(user: any, expiresAt: Date) {
  const selected = getRandomTasks(MONTHLY_BANK, 2);

  const tasks = selected.map(t => ({
    userId: user._id,
    title: t.key,
    type: 'monthly',
    category: t.cat,
    xpReward: t.xp,
    expiresAt
  }));

  await Task.insertMany(tasks);
}

export async function completeTask(taskId: string) {
  try {
    await connectDB();
    const task = await Task.findById(taskId);
    if (!task) return { success: false };

    task.isCompleted = true;
    await task.save();

    let streakUpdated = false;
    let newStreakValue = 0;

    if (task.type === 'daily') {
      const user = await User.findById(task.userId);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const lastStreakDate = user.lastStreakDate ? new Date(user.lastStreakDate) : new Date(0); lastStreakDate.setHours(0, 0, 0, 0);

      if (lastStreakDate.getTime() !== today.getTime()) {
        const allDailyTasks = await Task.find({ userId: task.userId, type: 'daily', expiresAt: { $gte: today } });
        const allDone = allDailyTasks.every((t: any) => t.isCompleted);

        if (allDone) {
          user.currentStreak = (user.currentStreak || 0) + 1;
          user.lastStreakDate = new Date();
          user.xp = (user.xp || 0) + 500;
          await user.save();
          streakUpdated = true;
          newStreakValue = user.currentStreak;
        }
      }
    } else {
      await addXP(task.xpReward);
    }

    revalidatePath("/");
    return { success: true, streakUpdated, newStreakValue };
  } catch (error) { return { success: false }; }
}

// ==========================================
// 🚩 Milestone System
// ==========================================

export async function getMilestones() {
  try {
    const user = await getUser();
    if (!user) return [];

    // ⚠️ التعديل: أزلنا { isCompleted: false } لنجلب الكل
    const milestones = await Milestone.find({ userId: user._id }).sort({ isCompleted: 1, createdAt: -1 });

    return JSON.parse(JSON.stringify(milestones));
  } catch (e) { return []; }
}

export async function createMilestone(formData: FormData) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    const rawData = {
      title: formData.get("title"),
      steps: formData.get("steps")
    };

    const validation = milestoneSchema.safeParse(rawData);
    if (!validation.success) return { success: false };

    const { title, steps: stepsString } = validation.data;
    let steps: { title: string; xp: number; isCompleted: boolean }[] = [];

    try {
      const parsedSteps = JSON.parse(stepsString);
      if (Array.isArray(parsedSteps)) {
        steps = parsedSteps.map((s: any) => {
          // 🛡️ تحديد الحد الأقصى: إذا كان الـ XP أكبر من 5000، نرجعه 5000
          let safeXP = Number(s.xp) || 100;
          if (safeXP > 5000) safeXP = 5000;
          if (safeXP < 10) safeXP = 10;

          return {
            title: DOMPurify.sanitize(s.title || ""),
            xp: safeXP,
            isCompleted: false
          };
        });
      }
    } catch (e) {
      steps = stepsString.split('\n').filter(s => s.trim()).map(s => ({
        title: DOMPurify.sanitize(s.trim()),
        isCompleted: false,
        xp: 100
      }));
    }

    await Milestone.create({
      userId: user._id,
      title,
      steps,
      xpReward: 1000 // مكافأة الإنهاء الكلية
    });

    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function toggleMilestoneStep(milestoneId: string, stepTitle: string) {
  try {
    const user = await getUser();
    const milestone = await Milestone.findOne({ _id: milestoneId, userId: user._id });
    if (!milestone) return { success: false };

    // العثور على الخطوة
    const step = milestone.steps.find((s: any) => s.title === stepTitle);

    if (step) {
      // ✅ تبديل الحالة (True/False)
      step.isCompleted = !step.isCompleted;
    } else {
      return { success: false, msg: "Step not found" };
    }

    // 🔥🔥 مهم جداً: إجبار المونجو دي بي على معرفة أن المصفوفة تغيرت ليتم الحفظ
    milestone.markModified('steps');

    // التحقق من اكتمال المايلستون بالكامل
    const allDone = milestone.steps.every((s: any) => s.isCompleted);
    let xpAwarded = 0;

    // حالة: المايلستون اكتمل الآن لأول مرة
    if (allDone && !milestone.isCompleted) {
      milestone.isCompleted = true;

      // حساب مجموع نقاط المهام الفردية
      const stepsXP = milestone.steps.reduce((acc: number, s: any) => acc + (s.xp || 100), 0);

      // المكافأة الكلية = مكافأة الإتمام (1000) + مجموع نقاط المهام
      xpAwarded = (milestone.xpReward || 1000) + stepsXP;

      await addXP(xpAwarded);
    }
    // حالة: المستخدم ألغى مهمة، نلغي اكتمال المايلستون
    else if (!allDone && milestone.isCompleted) {
      milestone.isCompleted = false;
      // ملاحظة: عادة لا نسحب الـ XP عند الإلغاء لتجنب التعقيد، لكن المايلستون يعود مفتوحاً
    }

    await milestone.save(); // ✅ الحفظ الفعلي في قاعدة البيانات
    revalidatePath("/");

    return { success: true, isCompleted: milestone.isCompleted, xpAwarded };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function deleteMilestone(id: string) {
  try { await Milestone.findByIdAndDelete(id); revalidatePath("/"); return { success: true }; }
  catch (e) { return { success: false }; }
}