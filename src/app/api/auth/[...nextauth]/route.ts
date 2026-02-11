import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
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

        // نرجع البيانات الأساسية
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image
        };
      }
    })
  ],
  session: { strategy: "jwt" }, // نستخدم JWT للأداء العالي
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
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
      return true;
    },

    // ✅ التعديل هنا: نستخدم JWT لحفظ الـ ID مرة واحدة
    async jwt({ token, user }) {
      // هذه تعمل فقط عند تسجيل الدخول لأول مرة
      if (user) {
        token.id = user.id;

        // لو كان الدخول عبر السوشيال، نحتاج نتأكد أننا جبنا الـ MongoID
        if (!token.id) {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) token.id = dbUser._id.toString();
        }
      }
      return token;
    },

    // ✅ الجلسة الآن خفيفة وسريعة، تقرأ من التوكن مباشرة
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };