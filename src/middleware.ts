import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // هذه الروابط هي التي سيتم حمايتها، أي شيء غيرها سيكون متاحاً للجميع
  matcher: [
    "/",                   // الصفحة الرئيسية
    "/fitness/:path*",     // كل صفحات الفتنس
    "/profile/:path*",     // البروفايل
    "/api/projects/:path*", // حماية الـ API
  ],
};