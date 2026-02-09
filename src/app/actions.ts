"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { sendDiscordMessage } from "@/lib/discord";

// 👇 إضافة مكتبة الترجمة
import translate from '@iamtraction/google-translate';

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
// 🔐 Authentication & Helpers
// ==========================================

export async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return null;
  
  await connectDB();
  const user = await User.findOne({ email: session.user.email });
  return user;
}

// ✅ دالة الترجمة
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

// دالة زيادة الخبرة واللفل
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
        image: `https://placehold.co/400x600/101010/FFF.png?text=${type.toUpperCase()}+${i+1}`,
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

    const tagsString = formData.get("tags") as string;
    
    await Project.create({
      userId: user._id,
      title: formData.get("title"),
      description: formData.get("description"),
      link: formData.get("link"),
      tags: tagsString ? tagsString.split(',') : [],
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

    await Project.findByIdAndUpdate(projectId, {
      status: 'completed',
      completedAt: new Date(),
      title: data.finalTitle || undefined,
      description: data.finalDescription || undefined,
      githubLink: data.githubLink,
      demoLink: data.demoLink,
      image: data.image,
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

export async function logWorkout(planId?: string) {
  try {
    const user = await getUser();
    if (!user) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const query: any = { userId: user._id, completedAt: { $gte: startOfDay } };
    if (planId) query.planId = planId;

    const existingWorkout = await Workout.findOne(query);
    if (existingWorkout) return;

    await Workout.create({
      userId: user._id,
      planId: planId,
      type: "Daily Session",
      xpEarned: 200
    });

    user.currentStreak = (user.currentStreak || 0) + 1;
    await user.save();
    
    await addXP(200);
    revalidatePath("/");
  } catch (error) { console.error("Log Workout Error:", error); }
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
    const activePlan = await WorkoutPlan.findOne({ userId: user._id, isActive: true });
    const newPlan = await WorkoutPlan.create({
      userId: user._id,
      title,
      description,
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
                name: ex.name,
                mediaUrl: ex.mediaUrl,
                mediaType: ex.mediaType,
                sets: Number(ex.sets),
                reps: Number(ex.reps),
                restBetweenSets: Number(ex.restBetweenSets),
            }));
    }

    const newDayData = {
        dayNumber: dayData.dayNumber,
        title: dayData.title,
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

// ✅ [Workout Rotation Logic]
export async function getActiveWorkoutSession() {
  try {
    const user = await getUser();
    if (!user) return { status: "error" };

    const plan = await WorkoutPlan.findOne({ userId: user._id, isActive: true });
    if (!plan || !plan.days || plan.days.length === 0) return { status: "no-plan" };

    // هنا يتم استخدام الـ Index لمعرفة يوم اليوم
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

// ✅ [Workout Rotation Logic] - Increment Index
export async function completeDailySession(planId: string) {
  try {
    const user = await getUser();
    if (!user) return { success: false };

    await logWorkout(planId); 
    
    const plan = await WorkoutPlan.findOne({ _id: planId, userId: user._id });
    if(plan) {
        // زيادة العداد لليوم التالي
        plan.currentDayIndex += 1;
        await plan.save();
    }
    revalidatePath("/");
    return { success: true };
  } catch (error) { return { success: false }; }
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

    const title = formData.get("title") as string;
    const description = formData.get("description") as string || "";
    const link = formData.get("link") as string || "";
    const totalUnits = Number(formData.get("totalUnits"));
    const image = formData.get("image") as string || "";

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
    const id = formData.get("id") as string;
    
    await Resource.findOneAndUpdate(
        { _id: id, userId: user._id },
        { 
            title: formData.get("title"), 
            description: formData.get("description"), 
            link: formData.get("link"), 
            totalUnits: Number(formData.get("totalUnits")), 
            image: formData.get("image")
        }
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
    await Course.create({
      userId: user._id,
      title: formData.get("title"),
      description: formData.get("description"),
      link: formData.get("link"),
      image: formData.get("image"),
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
      certificateTitle: certData.title,
      certificateLink: certData.link,
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
// 👤 User Profile Stats (Updated ✅)
// ==========================================

export async function getUserProfileStats() {
  try {
    const user = await getUser();
    if (!user) return { success: false };
    
    // 1. جلب السجل المفصل (للـ System Logs) - أحدث 20
    const [workouts, books, projects, courses, ent] = await Promise.all([
        Workout.find({ userId: user._id }).sort({ completedAt: -1 }).limit(10).populate('planId', 'title').lean(),
        Resource.find({ userId: user._id, status: 'completed' }).sort({ updatedAt: -1 }).limit(5).lean(),
        Project.find({ userId: user._id, status: 'completed' }).sort({ completedAt: -1 }).limit(5).lean(),
        Course.find({ userId: user._id, status: 'completed' }).sort({ completedAt: -1 }).limit(5).lean(),
        Entertainment.find({ userId: user._id, status: 'completed' }).sort({ completedAt: -1 }).limit(5).lean(),
    ]);

    // توحيد البيانات للسجل
    const combinedHistory = [
        ...workouts.map((w:any) => ({ id: w._id.toString(), title: w.planId?.title || "Workout", type: "workout", xp: w.xpEarned || 200, date: w.completedAt })),
        ...books.map((b:any) => ({ id: b._id.toString(), title: b.title, type: "book", xp: 300, date: b.updatedAt })),
        ...projects.map((p:any) => ({ id: p._id.toString(), title: p.title, type: "project", xp: 500, date: p.completedAt })),
        ...courses.map((c:any) => ({ id: c._id.toString(), title: c.title, type: "course", xp: 1000, date: c.completedAt })),
        ...ent.map((e:any) => ({ id: e._id.toString(), title: e.title, type: "entertainment", xp: 150, date: e.completedAt })),
    ].sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

    // 🔥 2. جلب "خريطة النشاط" الكاملة (Activity Map) للتقويم
    // نجلب فقط حقل التاريخ لجميع النشاطات (خفيف جداً على الداتابيس)
    const [allWorkouts, allBooks, allProjects, allCourses] = await Promise.all([
        Workout.find({ userId: user._id }).select('completedAt').lean(),
        Resource.find({ userId: user._id, status: 'completed' }).select('updatedAt').lean(),
        Project.find({ userId: user._id, status: 'completed' }).select('completedAt').lean(),
        Course.find({ userId: user._id, status: 'completed' }).select('completedAt').lean(),
    ]);

    // ندمج كل التواريخ في مصفوفة نصوص بسيطة (ISO Strings)
    const activityDates = [
        ...allWorkouts.map((i:any) => i.completedAt),
        ...allBooks.map((i:any) => i.updatedAt),
        ...allProjects.map((i:any) => i.completedAt),
        ...allCourses.map((i:any) => i.completedAt),
    ].map(date => new Date(date).toISOString().split('T')[0]); // نحفظ التاريخ فقط YYYY-MM-DD

    // 3. بقية البيانات
    const completedBooksList = await Resource.find({ userId: user._id, status: 'completed' }).sort({ updatedAt: -1 });
    const completedProjectsList = await Project.find({ userId: user._id, status: 'completed' }).sort({ updatedAt: -1 });
    const completedCoursesList = await Course.find({ userId: user._id, status: 'completed' }).sort({ completedAt: -1 });
    const totalWorkouts = await Workout.countDocuments({ userId: user._id });

    // Chart Data (Last 7 Days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
        const nextDay = new Date(d); nextDay.setDate(d.getDate() + 1);
        const count = await Workout.countDocuments({ userId: user._id, completedAt: { $gte: d, $lt: nextDay } });
        last7Days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), count });
    }

    return {
        success: true,
        user: JSON.parse(JSON.stringify(user)),
        history: combinedHistory,
        activityMap: activityDates, // ✅ المصفوفة الجديدة للتقويم
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
        const name = formData.get("name") as string;
        const image = formData.get("image") as string;
        const updateData: any = {};
        if (name && name.trim().length > 0) updateData.name = name;
        if (image && image.length > 0) updateData.image = image;
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
    if (type === 'manga') {
      const res = await fetch(`https://api.jikan.moe/v4/manga?q=${query}&limit=5`);
      const data = await res.json();
      return { success: true, results: data.data?.map((i: any) => ({
        apiId: i.mal_id.toString(),
        title: i.title_english || i.title, 
        image: i.images.jpg.large_image_url,
        rating: i.score ? `${i.score}/10` : "N/A",
        shortDescription: i.synopsis ? i.synopsis.substring(0, 120) + "..." : "",
        year: i.published?.from ? new Date(i.published.from).getFullYear() : "N/A",
        type: 'manga'
      })) || [] };
    }

    if (type === 'movie') {
       const API_KEY = process.env.TMDB_KEY;
       if (API_KEY) {
         const langParam = lang === 'ar' ? 'ar-SA' : 'en-US';
         const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${query}&language=${langParam}`);
         const data = await res.json();
         return { success: true, results: data.results?.filter((i:any) => i.media_type !== 'person').slice(0, 5).map((i:any) => ({
           apiId: i.id.toString(),
           title: i.title || i.name,
           image: i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : "",
           rating: i.vote_average ? `${i.vote_average.toFixed(1)}/10` : "N/A",
           shortDescription: i.overview ? i.overview.substring(0, 100) + "..." : "",
           year: (i.release_date || i.first_air_date || "").substring(0, 4),
           type: 'movie'
         })) || [] };
       }
       return { success: true, results: getMockResults(query, 'movie', lang) };
    }

    if (type === 'game') {
        const API_KEY = process.env.RAWG_KEY;
        if(API_KEY) {
            const res = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${query}&page_size=5`);
            const data = await res.json();
            return { success: true, results: data.results?.map((i:any) => ({
                apiId: i.id.toString(),
                title: i.name,
                image: i.background_image,
                rating: i.rating ? `${i.rating}/5` : "N/A",
                shortDescription: i.genres?.map((g:any) => g.name).slice(0,3).join(", ") || "", 
                year: i.released ? i.released.substring(0, 4) : "N/A",
                type: 'game'
            })) || [] };
        }
        return { success: true, results: getMockResults(query, 'game', lang) };
    }
    return { success: true, results: [] };
  } catch (e) { return { success: false, results: [] }; }
}

export async function getEntertainmentDetails(apiId: string, type: string, lang: 'ar' | 'en') {
    try {
        if (apiId.startsWith('mock')) return { success: true, details: getMockDetails(type, lang) };

        let rawDesc = "";
        let rawGenres = "";
        let trailer = null;
        let backdrop = null;
        let gallery: string[] = [];

        if (type === 'movie') {
            const API_KEY = process.env.TMDB_KEY;
            if(!API_KEY) return { success: true, details: getMockDetails(type, lang) };
            const langParam = lang === 'ar' ? 'ar-SA' : 'en-US';
            let res = await fetch(`https://api.themoviedb.org/3/movie/${apiId}?api_key=${API_KEY}&language=${langParam}&append_to_response=videos,images`);
            let isTv = false;
            if(!res.ok) {
                res = await fetch(`https://api.themoviedb.org/3/tv/${apiId}?api_key=${API_KEY}&language=${langParam}&append_to_response=videos,images`);
                isTv = true;
            }
            const data = await res.json();
            rawDesc = data.overview || "";
            rawGenres = data.genres?.map((g:any) => g.name).join(", ") || "";
            backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null;
            if (data.images?.backdrops) gallery = data.images.backdrops.slice(0, 4).map((img:any) => `https://image.tmdb.org/t/p/w780${img.file_path}`);
            let trailerKey = data.videos?.results?.find((v:any) => v.type === 'Trailer' && v.site === 'YouTube')?.key;
            if (!trailerKey) {
                 const enRes = await fetch(`https://api.themoviedb.org/3/${isTv ? 'tv' : 'movie'}/${apiId}/videos?api_key=${API_KEY}&language=en-US`);
                 const enData = await enRes.json();
                 trailerKey = enData.results?.find((v:any) => v.type === 'Trailer' && v.site === 'YouTube')?.key;
            }
            trailer = trailerKey ? `https://www.youtube.com/embed/${trailerKey}` : null;
        }

        if (type === 'manga') {
            const res = await fetch(`https://api.jikan.moe/v4/manga/${apiId}/full`);
            const data = await res.json();
            rawDesc = data.data?.synopsis || "";
            rawGenres = data.data?.genres?.map((g:any) => g.name).join(", ") || "";
        }

        if (type === 'game') {
            const API_KEY = process.env.RAWG_KEY;
            if(!API_KEY) return { success: true, details: getMockDetails(type, lang) };
            const res = await fetch(`https://api.rawg.io/api/games/${apiId}?key=${API_KEY}`);
            const data = await res.json();
            rawDesc = data.description_raw || data.description?.replace(/<[^>]*>?/gm, '') || "";
            rawGenres = data.genres?.map((g:any) => g.name).join(", ") || "";
            backdrop = data.background_image_additional || data.background_image;
            try {
                if (data.clip && data.clip.clip) { trailer = data.clip.clip; } 
                else {
                    const mov = await fetch(`https://api.rawg.io/api/games/${apiId}/movies?key=${API_KEY}`);
                    const movData = await mov.json();
                    if (movData.results?.length > 0) trailer = movData.results[0].data?.max;
                }
            } catch(e) {}
            try {
                const shots = await fetch(`https://api.rawg.io/api/games/${apiId}/screenshots?key=${API_KEY}`);
                const shotsData = await shots.json();
                if (shotsData.results) gallery = shotsData.results.slice(0, 4).map((s:any) => s.image);
            } catch (e) {}
        }

        let finalDesc = rawDesc;
        let finalGenres = rawGenres;
        if (lang === 'ar') {
            if (rawDesc) finalDesc = await translateToAr(rawDesc);
            if (rawGenres && /[a-zA-Z]/.test(rawGenres)) finalGenres = await translateToAr(rawGenres);
        }

        return { success: true, details: {
            description: finalDesc || (lang === 'ar' ? "لا يوجد وصف." : "No description."),
            trailer: trailer,
            genres: finalGenres,
            backdrop: backdrop,
            gallery: gallery
        }};

    } catch (e) {
        return { success: true, details: getMockDetails(type, lang) };
    }
}

export async function addEntertainment(data: any) {
  try {
    const user = await getUser();
    if(!user) return { success: false };
    const exists = await Entertainment.findOne({ userId: user._id, apiId: data.apiId });
    if (exists) return { success: false, message: "Already added!" };
    await Entertainment.create({ userId: user._id, ...data, status: 'pending' });
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
    if(!user) return { success: false };
    await Entertainment.findByIdAndUpdate(id, { status: 'completed', completedAt: new Date() });
    await addXP(150);
    revalidatePath("/");
    return { success: true };
  } catch (e) { return { success: false }; }
}

// ==========================================
// 🧠 Smart Task System (Updated ✅)
// ==========================================

const PROJECT_ACTIONS = ["Refactor code in", "Fix bugs in", "New feature for", "Optimize DB for", "Design UI for"];
const LEARNING_ACTIONS = ["Complete 1 module of", "Watch 20 mins of", "Take notes on", "Practice concepts from"];
const READING_ACTIONS = ["Read 15 pages of", "Summarize chapter of", "Read for 30 mins: "];

export async function getDashboardTasks() {
  try {
    const user = await getUser();
    if (!user) return { daily: [], weekly: [], monthly: [] };

    const now = new Date();
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
    
    // 1. Delete Expired Daily Tasks
    await Task.deleteMany({ userId: user._id, expiresAt: { $lt: now }, isCompleted: false });

    // 2. Generate Daily Tasks if needed
    const dailyCount = await Task.countDocuments({ userId: user._id, type: 'daily', expiresAt: { $gt: now } });
    if (dailyCount === 0) await generateDailyTasks(user, endOfDay);

    // 3. ✅ Generate Weekly Tasks if needed (New Logic)
    const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    const weeklyCount = await Task.countDocuments({ userId: user._id, type: 'weekly', expiresAt: { $gt: now } });
    if (weeklyCount === 0) await generateWeeklyTasks(user, endOfWeek);

    // 4. ✅ Generate Monthly Tasks if needed (New Logic)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthlyCount = await Task.countDocuments({ userId: user._id, type: 'monthly', expiresAt: { $gt: now } });
    if (monthlyCount === 0) await generateMonthlyTasks(user, endOfMonth);

    // 5. Fetch All
    const tasks = await Task.find({ userId: user._id, expiresAt: { $gt: now } }).sort({ isCompleted: 1, createdAt: -1 });
    
    return {
        daily: JSON.parse(JSON.stringify(tasks.filter((t:any) => t.type === 'daily'))),
        weekly: JSON.parse(JSON.stringify(tasks.filter((t:any) => t.type === 'weekly'))),
        monthly: JSON.parse(JSON.stringify(tasks.filter((t:any) => t.type === 'monthly'))),
    };

  } catch (e) { console.error(e); return { daily: [], weekly: [], monthly: [] }; }
}

// ☀️ Daily Generator
async function generateDailyTasks(user: any, expiresAt: Date) {
    const newTasks = [];
    const activePlan = await WorkoutPlan.findOne({ userId: user._id, isActive: true });
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const workoutDoneToday = await Workout.findOne({ userId: user._id, completedAt: { $gte: startOfDay } });

    if (activePlan && !workoutDoneToday) {
        const dayTitle = activePlan.days[activePlan.currentDayIndex]?.title || `Day ${activePlan.currentDayIndex + 1}`;
        newTasks.push({ userId: user._id, title: `Workout: ${dayTitle}`, type: 'daily', category: 'fitness', xpReward: 150, sourceId: activePlan._id, expiresAt });
    }

    const activeProjects = await Project.find({ userId: user._id, status: 'active' });
    if (activeProjects.length > 0) {
        const focusProject = activeProjects.find((p:any) => p.isFocus) || activeProjects[Math.floor(Math.random() * activeProjects.length)];
        const action = PROJECT_ACTIONS[Math.floor(Math.random() * PROJECT_ACTIONS.length)];
        newTasks.push({ userId: user._id, title: `${action} ${focusProject.title}`, type: 'daily', category: 'project', xpReward: 100, sourceId: focusProject._id, expiresAt });
    }

    const readingBook = await Resource.findOne({ userId: user._id, status: 'reading' });
    if (readingBook) {
        const action = READING_ACTIONS[Math.floor(Math.random() * READING_ACTIONS.length)];
        newTasks.push({ userId: user._id, title: `${action} ${readingBook.title}`, type: 'daily', category: 'reading', xpReward: 80, sourceId: readingBook._id, expiresAt });
    }

    if (newTasks.length === 0) {
        newTasks.push({ userId: user._id, title: "Plan your goals for tomorrow", type: 'daily', category: 'general', xpReward: 50, expiresAt });
    }
    await Task.insertMany(newTasks);
}

// 📅 Weekly Generator (New)
async function generateWeeklyTasks(user: any, expiresAt: Date) {
    const tasks = [
        { userId: user._id, title: "Weekly Code Review", type: 'weekly', category: 'project', xpReward: 300, expiresAt },
        { userId: user._id, title: "Long Cardio Session (45m)", type: 'weekly', category: 'fitness', xpReward: 300, expiresAt },
        { userId: user._id, title: "Organize Digital Workspace", type: 'weekly', category: 'general', xpReward: 200, expiresAt }
    ];
    await Task.insertMany(tasks);
}

// 🗓️ Monthly Generator (New)
async function generateMonthlyTasks(user: any, expiresAt: Date) {
    const tasks = [
        { userId: user._id, title: "Update Project Portfolio", type: 'monthly', category: 'project', xpReward: 1000, expiresAt },
        { userId: user._id, title: "Read 1 Full Book", type: 'monthly', category: 'reading', xpReward: 1000, expiresAt },
        { userId: user._id, title: "Review Monthly Goals", type: 'monthly', category: 'general', xpReward: 500, expiresAt }
    ];
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
        const today = new Date(); today.setHours(0,0,0,0);
        const lastStreakDate = user.lastStreakDate ? new Date(user.lastStreakDate) : new Date(0); lastStreakDate.setHours(0,0,0,0);
        
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
        // مكافأة المهام الأسبوعية والشهرية فورية
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
    const milestones = await Milestone.find({ userId: user._id, isCompleted: false }).sort({ deadline: 1 });
    return JSON.parse(JSON.stringify(milestones));
  } catch (e) { return []; }
}

export async function createMilestone(formData: FormData) {
  try {
    const user = await getUser();
    const title = formData.get("title");
    const deadline = formData.get("deadline");
    const stepsRaw = formData.get("steps") as string;
    const steps = stepsRaw ? stepsRaw.split('\n').filter(s => s.trim()).map(s => ({ title: s.trim(), isCompleted: false })) : [];

    await Milestone.create({
      userId: user._id,
      title,
      deadline: deadline ? new Date(deadline as string) : null,
      steps,
      xpReward: 1000
    });
    
    revalidatePath("/");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function toggleMilestoneStep(milestoneId: string, stepTitle: string) {
  try {
    const user = await getUser();
    const milestone = await Milestone.findOne({ _id: milestoneId, userId: user._id });
    if (!milestone) return;

    const step = milestone.steps.find((s:any) => s.title === stepTitle);
    if (step) step.isCompleted = !step.isCompleted;

    const allDone = milestone.steps.every((s:any) => s.isCompleted);
    if (allDone && !milestone.isCompleted) {
        milestone.isCompleted = true;
        await addXP(milestone.xpReward); 
    }

    await milestone.save();
    revalidatePath("/");
    return { success: true, isCompleted: milestone.isCompleted };
  } catch (e) { return { success: false }; }
}

export async function deleteMilestone(id: string) {
    try { await Milestone.findByIdAndDelete(id); revalidatePath("/"); return { success: true }; } 
    catch (e) { return { success: false }; }
}