import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // تأكد من المسار
import connectDB from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";

export async function GET(req: Request) {
  try {
    // 1. الأمان: التحقق من الجلسة (Session)
    // هذا يعني أن البيانات لن تظهر إلا إذا كان المتصفح مسجل دخول فعلاً في الموقع
    const session = await getServerSession(authOptions);

    // إعدادات الـ CORS (الأمان الخاص بالمتصفح)
    const headers = {
      "Access-Control-Allow-Origin": "*", // يفضل تغيير النجمة إلى رابط الإضافة لاحقاً إذا أمكن
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 2. إذا لم يكن هناك جلسة، نرفض الطلب فوراً
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login to Zenith first" }, 
        { status: 401, headers }
      );
    }

    await connectDB();

    // 3. جلب البيانات الخاصة بالمستخدم الحالي فقط
    // @ts-ignore
    const user = await User.findById(session.user.id).select("name level currentStreak xp");
    
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404, headers });
    }

    // @ts-ignore
    const pendingTasks = await Task.countDocuments({ 
        userId: session.user.id, // تأكد أننا نعد مهام هذا المستخدم فقط
        isCompleted: false, 
        type: 'daily' 
    });

    return NextResponse.json({
      loggedIn: true,
      name: user.name,
      level: user.level,
      streak: user.currentStreak,
      xp: user.xp,
      tasks: pendingTasks
    }, { status: 200, headers });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}