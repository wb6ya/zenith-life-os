"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, Dumbbell, Box, BookOpen, GraduationCap, Gamepad2, 
  X, Activity, LogOut, Crown, Zap, Flame, Bell, Globe, AlertTriangle
} from "lucide-react";
import { runDailyDiagnostics } from "@/app/actions";
import useSound from "use-sound";
import { useLanguage } from "@/context/LanguageContext";
import { signOut } from "next-auth/react";

// Components
import Library from "./Library";
import Projects from "./Projects";
import Courses from "./Courses";
import Entertainment from "./Entertainment";
import Fitness from "./Fitness";
import TaskCenter from "./TaskCenter"; 
import AICoach from "./AICoach";

interface DashboardProps { 
  user: any; projects: any[]; resources: any[]; courses: any[]; entertainment: any[]; tasks: any; milestones: any[]; isWorkoutDone: boolean; hasActivePlan: any; 
}

export default function Dashboard({ 
  user, projects, resources, courses, entertainment, tasks, 
  milestones, isWorkoutDone, hasActivePlan 
}: DashboardProps) {
  const router = useRouter();
  
  // ✅ استدعاء اللغة والترجمات
  let langContext;
  try { langContext = useLanguage(); } catch (e) { langContext = { setLang: () => {}, lang: 'en', t: {} }; }
  const { setLang, lang, t } = langContext;

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false); // حالة مودال الخروج
  const [mounted, setMounted] = useState(false);

  // Sounds
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.4 });
  const [playOpen] = useSound('/sounds/open.mp3', { volume: 0.2 });
  const [playClose] = useSound('/sounds/delete.mp3', { volume: 0.1 });
  const [playHover] = useSound('/sounds/hover.mp3', { volume: 0.05 });

  useEffect(() => { setMounted(true); }, []);

  // ترجمة القائمة الجانبية
  const navItems = [
      { id: 'fitness', icon: Dumbbell, label: t.nav_fitness || 'Fitness', color: 'text-cyan-400', glow: 'shadow-cyan-500/50' },
      { id: 'projects', icon: Box, label: t.nav_projects || 'Projects', color: 'text-indigo-400', glow: 'shadow-indigo-500/50' },
      { id: 'library', icon: BookOpen, label: t.nav_library || 'Library', color: 'text-pink-400', glow: 'shadow-pink-500/50' },
      { id: 'courses', icon: GraduationCap, label: t.nav_courses || 'Academy', color: 'text-yellow-400', glow: 'shadow-yellow-500/50' },
      { id: 'entertainment', icon: Gamepad2, label: t.nav_lounge || 'Lounge', color: 'text-purple-400', glow: 'shadow-purple-500/50' },
  ];

  const togglePanel = (id: string) => {
      if (activePanel === id) {
          playClose();
          setActivePanel(null);
      } else {
          playClick();
          playOpen();
          setActivePanel(id);
      }
  };

  const toggleLanguage = () => {
      playClick();
      setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const handleLogoutClick = () => {
      playClick();
      setIsLogoutOpen(true);
  };

  // Noise Texture for Background
  const noiseTexture = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E`;

  // --- Logout Modal ---
  const LogoutModal = () => {
      if (!mounted) return null;
      return createPortal(
          <AnimatePresence>
              {isLogoutOpen && (
                  <motion.div 
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" 
                    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  >
                      <motion.div 
                        initial={{scale:0.9, y: 20}} animate={{scale:1, y: 0}} exit={{scale:0.9, y: 20}}
                        className="bg-[#0A0A0A] border border-red-500/30 p-8 rounded-[32px] w-full max-w-sm text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]"
                        // توجيه النص داخل المودال حسب اللغة
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                              <LogOut className="text-red-500" size={32}/>
                          </div>
                          
                          <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
                              {t.logout_title || "ABORT SESSION?"}
                          </h3>
                          <p className="text-gray-500 text-xs mb-8 leading-relaxed">
                              {t.logout_msg || "You are about to disconnect from the system."}
                          </p>
                          
                          <div className="flex gap-3">
                              <button 
                                onClick={() => setIsLogoutOpen(false)} 
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-gray-400 transition-colors text-xs uppercase tracking-wider"
                              >
                                {t.logout_cancel || "STAY"}
                              </button>
                              
                              <button 
                                onClick={() => signOut()} 
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white transition-all shadow-lg shadow-red-900/20 text-xs uppercase tracking-wider hover:scale-105"
                              >
                                {t.logout_confirm || "DISCONNECT"}
                              </button>
                          </div>
                      </motion.div>
                  </motion.div>
              )}
          </AnimatePresence>,
          document.body
      );
  };

  return (
    // ⛔️ تثبيت الاتجاه LTR لمنع الانعكاس الكامل للصفحة
    <div className="h-screen w-full bg-[#030303] text-white overflow-hidden font-sans selection:bg-cyan-500/30 flex flex-col md:flex-row relative perspective-[2000px]" dir="ltr">
      
      {/* 🌌 BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04]" />
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: `url("${noiseTexture}")` }} />
          <motion.div 
            animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-50%] left-[-50%] w-[150%] h-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(34,211,238,0.05)_180deg,transparent_360deg)] blur-[150px]" 
          />
      </div>

      {/* 1️⃣ SIDEBAR (Fixed Left) */}
      <motion.nav 
        initial={{ y: 100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.2, type: "spring" }}
        className="
            fixed z-50 backdrop-blur-2xl bg-[#0A0A0A]/80 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]
            bottom-4 left-4 right-4 h-20 rounded-[32px] flex flex-row items-center justify-between px-6
            md:left-6 md:top-6 md:bottom-6 md:w-24 md:h-auto md:flex-col md:py-8 md:justify-start md:rounded-[40px]
        "
      >
          {/* Logo */}
          <div 
                className="hidden md:block mb-10 cursor-pointer group relative" 
                onClick={() => router.push('/manifesto')}
            >
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 bg-gradient-to-br from-[#151515] to-black border border-white/10 rounded-2xl flex items-center justify-center relative z-10 group-hover:border-cyan-500/50 transition-colors">
                    <Zap size={24} className="text-white group-hover:text-cyan-400 transition-colors" fill="currentColor"/>
                </div>
            </div>

          {/* Items */}
          <div className="flex flex-1 md:flex-col items-center justify-between md:justify-center gap-1 md:gap-6 w-full">
              {navItems.map((item) => (
                  <div key={item.id} className="relative group">
                      <button
                          onClick={() => togglePanel(item.id)}
                          onMouseEnter={() => playHover()}
                          className={`
                              rounded-xl flex items-center justify-center transition-all duration-300 relative z-10 
                              w-12 h-12 md:w-12 md:h-12
                              ${activePanel === item.id ? `bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-110` : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5'}
                          `}
                      >
                          <item.icon size={24} strokeWidth={activePanel === item.id ? 2.5 : 2} />
                      </button>
                      
                      {/* Tooltip (Fixed Position Left) */}
                      <span className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 bg-[#151515] border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none tracking-widest uppercase z-20 translate-x-2 group-hover:translate-x-0 shadow-xl">
                          {item.label}
                      </span>
                  </div>
              ))}
              
              <div className="md:hidden" onClick={() => router.push('/profile')}>
                   <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden relative">
                        {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#151515] flex items-center justify-center font-bold text-white text-xs">{user.name.charAt(0)}</div>}
                   </div>
              </div>
          </div>

          {/* Footer Actions */}
          <div className="hidden md:flex flex-col gap-4 mt-auto">
              <button onClick={toggleLanguage} className="w-10 h-10 rounded-full text-gray-500 hover:text-white flex items-center justify-center transition-all hover:bg-white/5 border border-transparent hover:border-white/10 group" title="Language">
                <Globe size={18} className="group-hover:rotate-12 transition-transform"/>
              </button>

              <button onClick={async () => await runDailyDiagnostics()} className="w-10 h-10 rounded-full text-gray-500 hover:text-cyan-400 flex items-center justify-center transition-all hover:bg-white/5" title="System Check">
                <Activity size={18} />
              </button>
              
              <div onClick={() => router.push('/profile')} className="w-12 h-12 rounded-full border border-white/10 cursor-pointer overflow-hidden relative group hover:border-white/50 transition-all shadow-lg">
                  {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[#151515] flex items-center justify-center font-bold text-white text-sm">{user.name.charAt(0)}</div>}
              </div>
          </div>
      </motion.nav>

      {/* 2️⃣ MAIN CONTENT (Padded Left) */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col px-4 pt-4 pb-28 md:pl-36 md:pr-6 md:pt-6 md:pb-6 perspective-[2000px]">
          
          {/* Header */}
          {/* ✅ هنا نغير اتجاه النص فقط حسب اللغة */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-6">
                  <div>
                      <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-none mb-1 uppercase">
                          {lang === 'ar' ? 'هلا،' : 'HELLO,'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">{user.name.split(' ')[0]}</span>
                      </h1>
                      <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"/> ONLINE</span>
                          <span className="w-px h-3 bg-white/10"/>
                          <span className="text-white/50">{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric' })}</span>
                      </div>
                  </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <button onClick={toggleLanguage} className="md:hidden w-9 h-9 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white font-bold text-xs">
                      {lang === 'ar' ? 'EN' : 'ع'}
                  </button>

                  <div className="h-9 md:h-10 px-3 md:px-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between md:justify-start gap-3 shadow-inner flex-1 md:flex-none">
                      <div className="flex items-center gap-1.5 text-orange-500">
                          <Flame size={12} fill="currentColor"/> 
                          <span className="text-xs font-bold">{user.currentStreak} <span className="hidden md:inline">{t.streak || "DAY"}</span></span>
                      </div>
                      <div className="w-px h-4 bg-white/10"/>
                      <div className="flex items-center gap-1.5 text-yellow-500">
                          <Crown size={12} fill="currentColor"/> 
                          <span className="text-xs font-bold">LVL {user.level}</span>
                      </div>
                  </div>

                  <button onClick={handleLogoutClick} className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-all flex-shrink-0">
                      <LogOut size={16}/>
                  </button>
              </div>
          </header>

          {/* Work Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 rounded-[32px] pb-10 md:pb-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <motion.div 
                animate={{ 
                    opacity: activePanel ? 0.3 : 1, 
                    scale: activePanel ? 0.95 : 1, 
                    x: activePanel && typeof window !== 'undefined' && window.innerWidth > 768 ? (lang === 'ar' ? 50 : -50) : 0, // إزاحة بسيطة للمحتوى
                    filter: activePanel ? "blur(4px)" : "blur(0px)" 
                }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="h-full"
              >
                  {/* AI Coach */}
                  <AICoach 
                      user={user} 
                      projects={projects} 
                      resources={resources} 
                      isWorkoutDone={isWorkoutDone} 
                      tasks={tasks}
                  />

                  {/* Widgets */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                      <div className="lg:col-span-2 p-6 md:p-8 bg-[#0A0A0A]/50 border border-white/5 rounded-[24px] md:rounded-[32px] relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"/>
                          <div className="relative z-10 flex justify-between items-end">
                              <div>
                                  <div className="flex items-center gap-2 mb-2 text-cyan-500">
                                      <LayoutGrid size={16}/> 
                                      <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">{t.dashboard_ops || "OPERATIONS"}</span>
                                  </div>
                                  <h2 className="text-2xl md:text-3xl font-black text-white max-w-md leading-tight">{t.dashboard_mission || "YOUR DAILY MISSION CONTROL"}</h2>
                              </div>
                              <div className="hidden md:block">
                                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                                      <Activity size={32}/>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="p-[1px] rounded-[24px] md:rounded-[32px] bg-gradient-to-b from-white/5 to-transparent">
                          <div className="h-full bg-[#0A0A0A] rounded-[23px] md:rounded-[31px] p-6 flex flex-col justify-center items-center text-center">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-3">
                                  <Zap size={20} fill="currentColor"/>
                              </div>
                              <span className="text-xl md:text-2xl font-black text-white">{tasks?.daily?.filter((t:any) => t.isCompleted).length || 0} / {tasks?.daily?.length || 0}</span>
                              <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t.tasks_complete_label || "TASKS COMPLETE"}</span>
                          </div>
                      </div>
                  </div>
                  
                  {/* Task Center */}
                  <TaskCenter tasks={tasks} milestones={milestones} userStreak={user.currentStreak} userLevel={user.level} />
              </motion.div>
          </div>

          {/* 3️⃣ GLASS PANEL (Fixed Right) */}
          <AnimatePresence>
              {activePanel && (
                  <>
                      {/* Dark Backdrop */}
                      <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          onClick={() => setActivePanel(null)}
                          className="absolute inset-0 bg-[#000000]/60 z-30 backdrop-blur-sm rounded-[32px] md:rounded-none"
                      />

                      {/* The Panel (Always from Right) */}
                      <motion.div 
                          key="panel"
                          initial={{ x: "100%", opacity: 0 }} 
                          animate={{ x: 0, opacity: 1 }} 
                          exit={{ x: "100%", opacity: 0 }} 
                          transition={{ type: "spring", stiffness: 300, damping: 35 }}
                          className={`
                            absolute z-40 bg-[#080808]/95 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col
                            /* Mobile */
                            inset-x-2 bottom-24 top-10 rounded-[32px]
                            /* Desktop (Fixed Right) */
                            md:inset-auto md:top-4 md:bottom-4 md:right-4 md:w-[60%] md:rounded-[32px]
                          `}
                          // ⚠️ المحتوى الداخلي للوحة فقط ينعكس
                          dir={lang === 'ar' ? 'rtl' : 'ltr'} 
                      >
                          {/* Header */}
                          <div className="h-16 md:h-20 flex-none flex items-center justify-between px-6 md:px-8 border-b border-white/5">
                              <div className="flex items-center gap-4">
                                  {(() => {
                                      const item = navItems.find(i => i.id === activePanel);
                                      const Icon = item?.icon || LayoutGrid;
                                      return (
                                          <>
                                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${item?.color} bg-white/5 border border-white/5`}>
                                                  <Icon size={18} className="md:w-5 md:h-5"/>
                                              </div>
                                              <span className="text-lg md:text-xl font-black text-white tracking-tight uppercase">{item?.label}</span>
                                          </>
                                      );
                                  })()}
                              </div>
                              <button onClick={() => setActivePanel(null)} className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"><X size={16}/></button>
                          </div>

                          {/* Content */}
                          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                              {activePanel === 'fitness' && <Fitness user={user} isWorkoutDone={isWorkoutDone} hasActivePlan={hasActivePlan} />}
                              {activePanel === 'projects' && <Projects projects={projects} />}
                              {activePanel === 'library' && <Library resources={resources} />}
                              {activePanel === 'courses' && <Courses courses={courses} />}
                              {activePanel === 'entertainment' && <Entertainment items={entertainment} />}
                          </div>
                      </motion.div>
                  </>
              )}
          </AnimatePresence>

      </main>

      {/* ✅ Logout Modal */}
      <LogoutModal />
    </div>
  );
}