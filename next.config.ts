/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // 👈 رفعنا الحد إلى 10 ميجا
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // السماح بكل الصور الخارجية
    ],
  },
};

export default nextConfig;