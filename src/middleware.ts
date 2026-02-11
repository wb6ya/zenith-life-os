import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * حماية كل المسارات ما عدا:
     * 1. /login, /register (صفحات الدخول)
     * 2. /api (كل روابط الـ API لأننا نتحقق من الأمان داخلها) 👈 هذا هو التعديل المهم
     * 3. /_next (ملفات النظام)
     * 4. الصور والملفات الثابتة
     */
    "/((?!login|register|api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};