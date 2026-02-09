// المسار: src/app/api/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  console.log("🔥 NEW API SIGNUP HIT: وصل الطلب للمسار الجديد");

  try {
    const body = await req.json();
    const { name, email, password } = body;
    console.log("📦 البيانات:", { name, email, passLen: password?.length });

    if (!name || !email || !password) {
      return NextResponse.json({ message: "البيانات ناقصة" }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "الإيميل مسجل مسبقاً" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.create({
      name,
      email,
      password: hashedPassword,
      level: 1, xp: 0, xpRequired: 100, currentStreak: 0
    });

    return NextResponse.json({ message: "تم التسجيل بنجاح" }, { status: 201 });

  } catch (error: any) {
    console.error("💥 Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}