"use client";
import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      // 👇 التعديل هنا: حذفنا (y: 20) و (y: 0) لمنع القفز
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}