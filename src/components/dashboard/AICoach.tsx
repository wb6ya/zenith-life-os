"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, Zap, Compass, Quote } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext"; // ✅ استيراد

interface CoachProps {
  user: any;
  projects: any[];
  resources: any[];
  isWorkoutDone: boolean;
  tasks: any;
}

export default function AICoach({ user, projects, resources, isWorkoutDone, tasks }: CoachProps) {
  const { t, lang } = useLanguage(); // ✅ استخدام اللغة
  const [message, setMessage] = useState<{ text: string; type: 'guide' | 'insight' | 'celebration' | 'focus' }>({ text: "", type: "guide" });
  const [typing, setTyping] = useState("");

  useEffect(() => {
    const analyzeData = () => {
        const hour = new Date().getHours();
        const userName = user.name.split(' ')[0];
        
        // 1. 🌱 New User
        const isNewUser = projects.length === 0 && resources.length === 0 && user.level === 1;
        if (isNewUser) {
            return { 
                text: t.coach_new_user.replace('{name}', userName), 
                type: "guide" 
            };
        }

        // 2. 🔄 Lost Streak
        if (user.currentStreak === 0 && user.level > 1) {
            return { 
                text: t.coach_lost_streak.replace('{name}', userName), 
                type: "insight" 
            };
        }

        // 3. 🚀 High Momentum
        if (user.currentStreak > 7) {
            return { 
                text: t.coach_high_streak.replace('{streak}', user.currentStreak), 
                type: "celebration" 
            };
        }

        // 4. 🏋️ Health
        if (!isWorkoutDone && hour > 16) {
            return { 
                text: t.coach_health, 
                type: "focus" 
            };
        }

        // 5. 📚 Library
        if (resources.length === 0) {
            return { 
                text: t.coach_empty_lib, 
                type: "guide" 
            };
        }

        // 6. ☀️ Morning
        if (hour < 10) {
            return { text: t.coach_morning.replace('{name}', userName), type: "insight" };
        }
        
        return { text: t.coach_default, type: "guide" };
    };

    const result = analyzeData();
    // @ts-ignore
    setMessage(result);
    
    // Typewriter Effect Reset
    setTyping("");
    let i = 0;
    const interval = setInterval(() => {
        setTyping(result.text.substring(0, i + 1));
        i++;
        if (i === result.text.length) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, [projects, resources, isWorkoutDone, tasks, user.currentStreak, user.name, user.level, lang]); // ✅ أضفنا lang للمراقبة

  // Design configs
  const getStyles = () => {
      switch (message.type) {
          case 'focus': return { icon: AlertCircle, color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/5", glow: "shadow-orange-500/10" };
          case 'celebration': return { icon: Zap, color: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/5", glow: "shadow-yellow-500/10" };
          case 'insight': return { icon: Quote, color: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/5", glow: "shadow-purple-500/10" };
          default: return { icon: Compass, color: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/5", glow: "shadow-cyan-500/10" };
      }
  };

  const style = getStyles();
  const Icon = style.icon;

  return (
    <motion.div 
        key={lang} // Force re-render on lang change
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className={`w-full p-6 mb-8 rounded-[24px] border ${style.border} ${style.bg} backdrop-blur-xl flex items-start gap-5 relative overflow-hidden group shadow-lg ${style.glow}`}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
        <div className={`absolute -top-10 ${lang === 'ar' ? '-right-10' : '-left-10'} w-32 h-32 rounded-full blur-[50px] opacity-20 ${style.bg.replace('/5', '/30')}`} />

        <div className={`p-3 rounded-2xl bg-[#0A0A0A]/40 border border-white/5 ${style.color} relative z-10 shadow-inner`}>
            <Icon size={24} strokeWidth={1.5} />
        </div>

        <div className="flex-1 pt-1 relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-60">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${style.color}`}>{t.coach_label}</span>
                <span className="w-1 h-1 bg-current rounded-full" />
                <span className="text-[10px] text-gray-400 font-mono">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <p className="text-base md:text-lg font-medium text-white/90 leading-relaxed font-sans">
                {typing}<span className={`animate-pulse ${style.color}`}>|</span>
            </p>
        </div>
    </motion.div>
  );
}