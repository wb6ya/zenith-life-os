import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";

export async function GET(req: Request) {
    try {
        // 1. فحص المتغيرات
        if (!process.env.MONGODB_URI) throw new Error("❌ MONGODB_URI is missing!");
        if (!process.env.NEXTAUTH_SECRET) throw new Error("❌ NEXTAUTH_SECRET is missing!");

        // 2. الاتصال
        await connectDB();
        
        // 3. الجلسة
        const session = await getServerSession(authOptions);

        // إعدادات CORS (عشان الإضافة تشتغل)
        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
        };

        if (!session || !session.user) {
            return NextResponse.json({ loggedIn: false, message: "No active session" }, { status: 200, headers });
        }

        // 4. البحث عن المستخدم (الذكاء هنا 🧠)
        // نحاول البحث بالـ ID، إذا فشل (بسبب أنه نص وليس ObjectId) نرجع null بدون ما ينهار السيرفر
        // @ts-ignore
        let user = await User.findById(session.user.id).select("name level currentStreak xp").catch(() => null);

        // الخطة ب: إذا لم نجده بالـ ID، نبحث بالإيميل (أضمن شيء)
        if (!user && session.user.email) {
            user = await User.findOne({ email: session.user.email }).select("name level currentStreak xp");
        }

        // إذا بعد كل هذا المستخدم غير موجود في القاعدة (حالة نادرة جداً)
        if (!user) {
             return NextResponse.json({ error: "User found in session but not in DB" }, { status: 404, headers });
        }

        // 5. حساب المهام (التعديل المهم هنا 👇)
        // نستخدم user._id (الآيدي الحقيقي من الداتابيس) عشان نضمن ما يصير خطأ CastError مرة ثانية
        const pendingTasks = await Task.countDocuments({ 
            userId: user._id, 
            isCompleted: false, 
            type: 'daily' 
        });

        // 6. النتيجة النهائية
        return NextResponse.json({
            loggedIn: true,
            name: user.name,
            level: user.level,
            streak: user.currentStreak,
            xp: user.xp,
            tasks: pendingTasks
        }, { status: 200, headers });

    } catch (error: any) {
        console.error("🔥 FATAL API ERROR:", error);
        
        return NextResponse.json({
            error: "Server Crash Detected",
            errorMessage: error.message,
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}