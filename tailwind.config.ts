import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // هذا السطر هو سر تشغيل تيلويند
  ],
  theme: {
    extend: {
      colors: {
        zenith: {
          bg: "#050505",
          card: "#0A0A0A",
          border: "#1F1F1F",
          primary: "#3b82f6",
          success: "#10b981",
          danger: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
export default config;