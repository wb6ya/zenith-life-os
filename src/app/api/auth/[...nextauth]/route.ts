import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // 2. GitHub
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // 3. Email/Password (القديم)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) throw new Error("User not found");
        const isCorrectPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isCorrectPassword) throw new Error("Invalid password");
        return { id: user._id.toString(), name: user.name, email: user.email };
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // منطق الدخول عبر السوشيال ميديا
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // مستخدم جديد؟ ننشئ له حساب تلقائياً
            await User.create({
              name: user.name,
              email: user.email,
              // نضع باسورد عشوائي لأنه لن يحتاجه (يدخل عبر السوشيال)
              password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
              level: 1,
              xp: 0,
              xpRequired: 100,
              currentStreak: 0
            });
          }
          return true;
        } catch (error) {
          console.log("Error checking if user exists: ", error);
          return false;
        }
      }
      return true; // للدخول العادي (Credentials)
    },
    async session({ session, token }) {
      if (session?.user) {
        // نربط الـ ID بالجلسة عشان نستخدمه في الموقع
        // نحتاج نجيبه من الداتابيس لأن الـ token.sub قد يختلف في السوشيال
        await connectDB();
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
            (session.user as any).id = dbUser._id.toString();
            session.user.name = dbUser.name; // تحديث الاسم من الداتابيس
        }
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };