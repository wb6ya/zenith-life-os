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
     * 2. /api/auth (مسارات المصادقة)
     * 3. /_next (ملفات النظام)
     * 4. الصور والملفات الثابتة (favicon, images)
     */
    "/((?!login|register|api/auth|_next/static|_next/image|favicon.ico|images).*)",
  ],
};