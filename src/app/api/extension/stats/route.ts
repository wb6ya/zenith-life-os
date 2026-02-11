import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";

export async function GET(req: Request) {
    try {
        // 1. فحص المتغيرات قبل البدء (أول سبب للسقوط)
        if (!process.env.MONGODB_URI) {
            throw new Error("❌ MONGODB_URI is missing in Vercel Environment Variables!");
        }
        if (!process.env.NEXTAUTH_SECRET) {
            throw new Error("❌ NEXTAUTH_SECRET is missing in Vercel Environment Variables!");
        }

        // 2. محاولة الاتصال بقاعدة البيانات
        console.log("➡️ Connecting to DB...");
        await connectDB();
        console.log("✅ DB Connected");

        // 3. محاولة جلب الجلسة
        console.log("➡️ Fetching Session...");
        const session = await getServerSession(authOptions);
        console.log("ℹ️ Session Result:", session ? "User Found" : "No Session");

        // إعدادات CORS
        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
        };

        if (!session || !session.user) {
            return NextResponse.json({ loggedIn: false, message: "No active session found" }, { status: 200, headers });
        }

        // 4. جلب بيانات المستخدم
        // @ts-ignore
        const user = await User.findById(session.user.id).select("name level currentStreak xp");

        if (!user) {
            throw new Error(`❌ User found in session but NOT in Database! ID: ${session.user.id}`);
        }

        // @ts-ignore
        const pendingTasks = await Task.countDocuments({ userId: session.user.id, isCompleted: false, type: 'daily' });

        return NextResponse.json({
            loggedIn: true,
            name: user.name,
            level: user.level,
            streak: user.currentStreak,
            xp: user.xp,
            tasks: pendingTasks
        }, { status: 200, headers });

    } catch (error: any) {
        console.error("🔥 FATAL ERROR:", error);

        // هذا هو الجزء المهم: سنعيد الخطأ الحقيقي للمتصفح
        return NextResponse.json({
            error: "Server Crash Detected",
            errorMessage: error.message, // 👈 هنا سيظهر السبب
            errorStack: error.stack
        }, { status: 500 });
    }
}