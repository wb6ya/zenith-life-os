"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useSession, SessionProvider } from "next-auth/react";

// --- المكون الداخلي ---
function NotFoundContent() {
  // 1. اللغة
  let languageContext;
  try { languageContext = useLanguage(); } 
  catch (e) { languageContext = { lang: 'en', t: {} }; }
  const { lang } = languageContext;
  const isAr = lang === 'ar';

  // 2. جلسة المستخدم
  const { data: session } = useSession();
  const username = session?.user?.name || (isAr ? "اللاعب" : "Player");

  // 3. النصوص
  const titleText = isAr ? "الصفحة مفقودة!" : "Page Not Found!";
  
  const subText = isAr 
    ? `حاول ${username} الوصول إلى عالم غير موجود`
    : `${username} tried to swim in a non-existent page`;

  // 🎨 ستايل الأزرار الماينكرافتية
  const mcButtonStyle = `
    relative w-[350px] max-w-[90vw] py-3 text-center text-white text-xl md:text-2xl
    bg-[#6c6c6c] border-2 border-black/50
    shadow-[inset_2px_2px_0px_#a3a3a3,inset_-2px_-2px_0px_#424242] 
    hover:bg-[#7a7a7a] hover:shadow-[inset_2px_2px_0px_#b8b8b8,inset_-2px_-2px_0px_#505050]
    active:bg-[#505050] active:shadow-[inset_2px_2px_0px_#424242,inset_-2px_-2px_0px_#a3a3a3]
    transition-none select-none cursor-pointer font-smooth-none
  `;

  return (
    <>
      {/* تحميل الخطوط */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Changa:wght@500;700;800&display=swap');
        
        .mc-font-en { font-family: 'VT323', monospace; }
        .mc-font-ar { font-family: 'Changa', sans-serif; }
        .pixelated { image-rendering: pixelated; }
      `}</style>

      {/* الحاوية الرئيسية مع دعم RTL */}
      <div 
        dir={isAr ? "rtl" : "ltr"} 
        className={`relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-[#2a0000] selection:bg-transparent ${isAr ? 'mc-font-ar' : 'mc-font-en'}`}
      >
        
        {/* 🌋 الخلفية */}
        <div className="absolute inset-0 z-0">
            <div 
                className="absolute inset-0 bg-cover bg-center pixelated scale-110"
                style={{ 
                    backgroundImage: 'url("https://forum.godotengine.org/uploads/default/original/3X/3/1/31ca515989c9b71c0e785650d172cd03a2188bc3.gif")'
                }}
            />
            {/* طبقة حمراء شفافة */}
            <div className="absolute inset-0 bg-red-900/40 mix-blend-multiply" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#1a0505_100%)] opacity-90" />
        </div>

        {/* 💀 المحتوى الرئيسي */}
        <div className="relative z-10 flex flex-col items-center text-center">
          
          {/* العنوان الكبير */}
          <motion.h1 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-6xl md:text-8xl text-white mb-4 drop-shadow-[4px_4px_0_#000] font-bold ${isAr ? 'tracking-normal' : 'tracking-widest'}`}
          >
            {titleText}
          </motion.h1>

          {/* اسم المستخدم والسبب */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-3xl text-[#aaaaaa] mb-2 drop-shadow-[2px_2px_0_#000] font-medium px-4"
          >
            {subText}
          </motion.p>

          {/* النتيجة / كود الخطأ (تم إصلاح اللون هنا) */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-3xl mb-16 drop-shadow-[2px_2px_0_#000]"
          >
            {/* النص أصفر (Score) والرقم أحمر (Error) */}
            <span className="text-[#ffff55]">{isAr ? "رمز الخطأ: " : "Error Code: "}</span>
            <span className="text-[#ff5555]">404</span>
          </motion.p>

          {/* الأزرار */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col gap-4 w-full items-center"
          >
            <button onClick={() => window.location.reload()} className={mcButtonStyle}>
              {isAr ? "إعادة المحاولة" : "Respawn"}
            </button>

            <Link href="/">
              <button className={mcButtonStyle}>
                {isAr ? "القائمة الرئيسية" : "Title Screen"}
              </button>
            </Link>
          </motion.div>

        </div>

        {/* 💬 شريط الدردشة (يتغير مكانه حسب اللغة) */}
        <motion.div 
            initial={{ opacity: 0, x: isAr ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
            className={`absolute bottom-4 ${isAr ? 'right-4' : 'left-4'} text-lg md:text-xl text-white opacity-80 pointer-events-none hidden md:block drop-shadow-[2px_2px_0_#000]`}
        >
            <span dir="ltr">{`<System> Error 404: Location unknown`}</span>
        </motion.div>

      </div>
    </>
  );
}

// 🛡️ المكون الرئيسي
export default function NotFound() {
  return (
    <SessionProvider>
      <NotFoundContent />
    </SessionProvider>
  );
}