import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";

// Models
import User from "@/models/User";
import Project from "@/models/Project";
import Resource from "@/models/Resource";
import WorkoutPlan from "@/models/WorkoutPlan";
import Workout from "@/models/Workout";
import Course from "@/models/Course";
import Entertainment from "@/models/Entertainment";

// Actions
import { getDashboardTasks, getMilestones } from "./actions"; // ✅ استدعاء getMilestones

import Dashboard from "@/components/dashboard/Dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) redirect("/login");

  await connectDB();
  
  const userData = await User.findOne({ email: session.user.email }).lean();
  if (!userData) redirect("/login");

  const userId = userData._id;
  const today = new Date(); 
  today.setHours(0,0,0,0);

  // 🚀 جلب كل البيانات دفعة واحدة
  const [
    projectsData,
    resourcesData,
    coursesData,
    entData,
    activePlanData,
    workoutTodayData,
    tasksData,
    milestonesData // ✅
  ] = await Promise.all([
    Project.find({ userId, status: 'active' }).sort({ createdAt: -1 }).lean(),
    Resource.find({ userId }).sort({ lastUpdated: -1 }).lean(),
    Course.find({ userId }).sort({ createdAt: -1 }).lean(),
    Entertainment.find({ userId }).sort({ createdAt: -1 }).lean(),
    WorkoutPlan.findOne({ userId, isActive: true }).lean(),
    Workout.findOne({ userId, completedAt: { $gte: today } }).lean(),
    getDashboardTasks(),
    getMilestones() // ✅
  ]);

  // Serialization
  const user = JSON.parse(JSON.stringify(userData));
  const projects = JSON.parse(JSON.stringify(projectsData));
  const resources = JSON.parse(JSON.stringify(resourcesData));
  const courses = JSON.parse(JSON.stringify(coursesData));
  const entertainment = JSON.parse(JSON.stringify(entData));
  const tasks = JSON.parse(JSON.stringify(tasksData));
  const milestones = JSON.parse(JSON.stringify(milestonesData)); // ✅
  
  let activePlan = activePlanData ? JSON.parse(JSON.stringify(activePlanData)) : null;
  if (activePlan && activePlan.days) {
      activePlan.currentDay = activePlan.days[activePlan.currentDayIndex || 0] || null;
  }

  user.xp = user.xp || 0;
  user.xpRequired = user.xpRequired || 100;
  user.level = user.level || 1;
  user.currentStreak = user.currentStreak || 0;

  return (
    <Dashboard 
        user={user} 
        projects={projects} 
        resources={resources} 
        courses={courses}
        entertainment={entertainment}
        tasks={tasks}
        milestones={milestones} // ✅ تمرير المايلستون
        isWorkoutDone={!!workoutTodayData}
        hasActivePlan={activePlan}
    />
  );
}