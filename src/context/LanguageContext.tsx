"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
// 👇 تأكد أن هذا المسار يطابق مكان ملف الترجمة الذي أنشأناه سابقاً
import { translations } from './translations'; 
import { toast } from "sonner";

type Lang = 'en' | 'ar';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  // ✅ نربط النوع بملف الترجمة لضمان الـ Auto-complete
  t: typeof translations['ar']; 
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Load from localStorage
  useEffect(() => {
    // نتأكد أننا في بيئة المتصفح
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('zenith-lang') as Lang;
        if (saved && (saved === 'en' || saved === 'ar')) {
            setLangState(saved);
            document.documentElement.lang = saved;
        }
    }
  }, []);

  const handleSetLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('zenith-lang', l);
    
    // ✅ تحديث كود اللغة فقط (بدون dir) للحفاظ على السايدبار
    document.documentElement.lang = l;
    
    // التوست (إشعار التغيير)
    if (l === 'ar') {
        toast.success('تم تغيير اللغة إلى العربية 🇸🇦', {
            style: { 
                background: "#101010", 
                color: "#fff", 
                border: "1px solid #333",
                fontFamily: 'sans-serif',
                direction: 'rtl'
            }
        });
    } else {
        toast.success('Language switched to English 🇺🇸', {
            style: { 
                background: "#101010", 
                color: "#fff", 
                border: "1px solid #333" 
            }
        });
    }
  };

  return (
    // ✅ نمرر t بناءً على اللغة الحالية
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}