/** @type {import('next').NextConfig} */
const nextConfig = {
  // تفعيل الوضع الصارم
  reactStrictMode: true,

  serverExternalPackages: ["jsdom"],
  
  // إخفاء تقنية "X-Powered-By: Next.js" عشان الهاكر ما يعرف نوع السيرفر
  poweredByHeader: false, 

  async headers() {
    return [
      {
        source: '/:path*', // تطبيق الحماية على كل الصفحات
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload' // يجبر المتصفح يستخدم HTTPS دائماً
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' // يمنع وضع موقعك داخل iframe في مواقع أخرى (حماية من Clickjacking)
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff' // يمنع المتصفح من تخمين نوع الملفات (حماية من هجمات الرفع)
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin' // حماية الخصوصية عند الانتقال لروابط خارجية
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block' // حماية إضافية من XSS للمتصفحات القديمة
          }
        ]
      }
    ];
  }
};

export default nextConfig;