"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';
import toast from 'react-hot-toast'; // ✅ استيراد التوست

type Lang = 'en' | 'ar';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zenith-lang') as Lang;
    if (saved) setLang(saved);
  }, []);

  const handleSetLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('zenith-lang', l);
    
    // ✅🔥 هنا يظهر التوست بناءً على اللغة المختارة
    if (l === 'ar') {
        toast.success('تم تغيير اللغة إلى العربية', {
            icon: '🌍',
            style: { fontFamily: 'sans-serif' } // عشان الخط العربي يطلع حلو
        });
    } else {
        toast.success('Language switched to English', {
            icon: '🌍',
        });
    }
  };

  return (
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