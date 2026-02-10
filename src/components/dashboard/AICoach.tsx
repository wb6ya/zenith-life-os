"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
// ✅ أضفنا Sun و Coffee و Moon إلى قائمة الاستيراد
import { 
  Sparkles, AlertCircle, Zap, Compass, Quote, Brain, 
  Target, ShieldAlert, Flame, Trophy, Sun, Coffee, Moon 
} from "lucide-react";import { useLanguage } from "@/context/LanguageContext";

interface CoachProps {
  user: any;
  projects: any[];
  resources: any[];
  isWorkoutDone: boolean;
  tasks: any;
}

export default function AICoach({ user, projects, resources, isWorkoutDone, tasks }: CoachProps) {
  const { t, lang } = useLanguage();
  
  const [message, setMessage] = useState<{ text: string; type: string }>({ text: "", type: "guide" });
  const [typing, setTyping] = useState("");
  const [timeDisplay, setTimeDisplay] = useState("");
  const [ticker, setTicker] = useState(0); 
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🧠 تحليل البيانات الذكي (Smart Analysis)
  const stats = useMemo(() => {
      const dailyTasks = tasks?.daily || [];
      const pending = dailyTasks.filter((t: any) => !t.isCompleted);
      const completed = dailyTasks.filter((t: any) => t.isCompleted);
      const total = dailyTasks.length;
      
      // البحث عن "الوحش" (أعلى مهمة XP لم تكتمل)
      const bossTask = pending.sort((a:any, b:any) => b.xpReward - a.xpReward)[0];

      return { pending, completed, total, bossTask };
  }, [tasks]);

  // 🕒 الساعة
  useEffect(() => {
      const updateClock = () => {
          const now = new Date();
          setTimeDisplay(now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
          setTicker(prev => prev + 1);
      };
      updateClock(); 
      const now = new Date();
      const delay = (60 - now.getSeconds()) * 1000;
      const timeoutId = setTimeout(() => {
          updateClock();
          const intervalId = setInterval(updateClock, 60000);
          return () => clearInterval(intervalId);
      }, delay);
      return () => clearTimeout(timeoutId);
  }, []);

  // 🤖 المنطق السلوكي (Behavior Engine)
  useEffect(() => {
    const analyzeData = () => {
        const date = new Date();
        const hour = date.getHours();
        const userName = user.name.split(' ')[0];
        const { pending, completed, total, bossTask } = stats;
        
        // 1. 🛑 حالات الطوارئ (الأولوية القصوى)
        if (hour >= 1 && hour < 5) return { text: t.coach_late_night?.replace('{name}', userName), type: "warning" };
        if (user.currentStreak === 0 && user.level > 2) return { text: t.coach_lost_streak?.replace('{name}', userName), type: "danger" };

        // 2. 🔥 حالة "الوحش" (Boss Fight)
        // إذا كان هناك مهمة صعبة جداً ولم تنجز والوقت متأخر قليلاً
        if (bossTask && bossTask.xpReward >= 300 && hour > 12) {
            return { 
                text: t.coach_boss_fight?.replace('{task}', bossTask.title).replace('{xp}', bossTask.xpReward), 
                type: "boss" 
            };
        }

        // 3. 🚀 حالة "الإنجاز السريع" (Morning Glory / Burnout Check)
        if (hour < 12 && completed.length >= 3) {
            return { text: t.coach_morning_glory, type: "glory" };
        }
        if (completed.length > 5 && pending.length > 0) {
             return { text: t.coach_burnout_warning, type: "calm" };
        }

        // 4. 📉 حالة "الخمول" (Slump)
        if (hour >= 14 && hour <= 18 && completed.length === 0) {
             return { text: t.coach_distracted?.replace('{name}', userName), type: "danger" };
        }

        // 5. 🏁 حالة "النهاية القوية" (Finish Strong)
        if (pending.length <= 2 && pending.length > 0 && hour > 18) {
            return { text: t.coach_finish_strong?.replace('{count}', pending.length), type: "focus" };
        }

        // 6. 🏆 الانتصار الكامل
        if (total > 0 && pending.length === 0) {
            return { text: t.coach_perfect_day, type: "celebration" };
        }

        // 7. 📜 الوضع الافتراضي (حكمة)
        const quotes = [t.quote_1, t.quote_2, t.quote_3, t.quote_4, t.quote_5].filter(Boolean);
        const randomQuote = quotes[(ticker + date.getDate()) % quotes.length] || t.coach_default;
        return { text: randomQuote, type: "quote" };
    };

    const result = analyzeData();
    setMessage(prev => {
        if (prev.text !== result.text) {
            startTyping(result.text);
            return result; 
        }
        return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, user.currentStreak, user.name, lang, ticker]);

  const startTyping = (fullText: string) => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      setTyping("");
      let i = 0;
      typingIntervalRef.current = setInterval(() => {
          setTyping(fullText.substring(0, i + 1));
          i++;
          if (i === fullText.length) {
              if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          }
      }, 30);
  };

  useEffect(() => { return () => { if (typingIntervalRef.current) clearInterval(typingIntervalRef.current); } }, []);

  // 🎨 نظام الألوان المتقدم (Mood System)
  const getStyles = () => {
      switch (message.type) {
          case 'danger': return { icon: ShieldAlert, color: "text-red-500", border: "border-red-500/40", bg: "bg-red-900/10", glow: "shadow-red-500/20" };
          case 'boss': return { icon: Flame, color: "text-orange-500", border: "border-orange-500/40", bg: "bg-orange-900/10", glow: "shadow-orange-500/20" };
          case 'glory': return { icon: Sun, color: "text-yellow-400", border: "border-yellow-400/40", bg: "bg-yellow-900/10", glow: "shadow-yellow-400/20" };
          case 'celebration': return { icon: Trophy, color: "text-yellow-300", border: "border-yellow-300/40", bg: "bg-yellow-900/10", glow: "shadow-yellow-300/20" };
          case 'calm': return { icon: Coffee, color: "text-emerald-400", border: "border-emerald-400/40", bg: "bg-emerald-900/10", glow: "shadow-emerald-400/20" };
          case 'focus': return { icon: Target, color: "text-blue-400", border: "border-blue-400/40", bg: "bg-blue-900/10", glow: "shadow-blue-400/20" };
          case 'quote': return { icon: Brain, color: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/5", glow: "shadow-cyan-500/10" };
          case 'warning': return { icon: AlertCircle, color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/5", glow: "shadow-red-500/10" };
          default: return { icon: Compass, color: "text-gray-400", border: "border-gray-500/20", bg: "bg-gray-500/5", glow: "shadow-gray-500/10" };
      }
  };

  const style = getStyles();
  const Icon = style.icon;

  return (
    <motion.div 
        key={lang} 
        initial={{ opacity: 0, y: 5 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4 }}
        // Added smooth transition for colors
        className={`w-full p-6 mb-8 rounded-[24px] border ${style.border} ${style.bg} backdrop-blur-xl flex items-start gap-5 relative overflow-hidden group shadow-lg transition-colors duration-700 ${style.glow}`}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
        {/* الخلفية تتوهج حسب الحالة */}
        <div className={`absolute -top-10 ${lang === 'ar' ? '-right-10' : '-left-10'} w-40 h-40 rounded-full blur-[60px] opacity-20 transition-colors duration-1000 ${style.bg.replace('/10', '/40').replace('/5', '/20')}`} />

        <div className={`p-3.5 rounded-2xl bg-[#0A0A0A]/60 border border-white/5 ${style.color} relative z-10 shadow-inner ring-1 ring-white/5 transition-colors duration-500`}>
            <Icon size={24} strokeWidth={1.5} className="animate-pulse-slow" />
        </div>

        <div className="flex-1 pt-1.5 relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-50">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${style.color} transition-colors duration-500`}>{t.coach_label}</span>
                <span className="w-1 h-1 bg-current rounded-full" />
                <span className="text-[10px] text-gray-400 font-mono tracking-widest">
                    {timeDisplay}
                </span>
            </div>
            
            {message.type === 'quote' ? (
                <div className="font-serif italic text-white/80 text-lg leading-relaxed">
                    <span className="opacity-50 text-2xl">"</span>
                    {typing}
                    <span className="opacity-50 text-2xl">"</span>
                </div>
            ) : (
                <p className="text-base md:text-lg font-medium text-white/90 leading-relaxed font-sans min-h-[3.5rem]">
                    {typing}<span className={`animate-pulse ${style.color}`}>_</span>
                </p>
            )}
        </div>
    </motion.div>
  );
}