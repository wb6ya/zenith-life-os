"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, BookOpen, Dumbbell, Briefcase, Edit3, X, Loader2, Camera,
  Shield, Activity, Zap, Layers, Star, ExternalLink, Brain, Target, Flame,
  Search, LayoutList, LayoutGrid, Trophy, Calendar, Award, Code
} from "lucide-react";
import { getUserProfileStats, updateUserProfile } from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  // @ts-ignore
  const txt = t || {};

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'performance' | 'archive'>('performance');
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const [archiveView, setArchiveView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'books' | 'projects' | 'courses'>('all');

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState(""); 
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getUserProfileStats();
      if (res.success) {
        setData(res);
        setNewName(res.user.name);
        setNewImage(res.user.image || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setCurrentDate(newDate);
  };

  const isDayActive = (day: number) => {
      if (!data || !data.activityMap) return false;
      const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const offset = checkDate.getTimezoneOffset();
      const date = new Date(checkDate.getTime() - (offset*60*1000));
      return data.activityMap.includes(date.toISOString().split('T')[0]);
  };

  const getLogIcon = (item: any) => {
      if (item.planId) return { icon: Dumbbell, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: txt.nav_fitness || "Fitness" }; 
      if (item.xpEarned === 300) return { icon: BookOpen, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", label: txt.nav_library || "Library" }; 
      if (item.xpEarned === 500) return { icon: Code, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: txt.nav_projects || "Project" }; 
      return { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: txt.stats_daily || "Activity" }; 
  };

  const formatLogDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (date.toDateString() === now.toDateString()) return txt.log_today || "Today";
      if (diffDays === 1) return txt.log_yesterday || "Yesterday";
      return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }); 
  };

  const filteredArchive = useMemo(() => {
      if (!data) return [];
      const { completedBooks, completedProjects, completedCourses } = data;
      let items: any[] = [];
      if (filterType === 'all' || filterType === 'books') items = [...items, ...completedBooks.map((b:any) => ({...b, type: 'book', date: b.updatedAt}))];
      if (filterType === 'all' || filterType === 'projects') items = [...items, ...completedProjects.map((p:any) => ({...p, type: 'project', date: p.updatedAt}))];
      if (filterType === 'all' || filterType === 'courses') items = [...items, ...completedCourses.map((c:any) => ({...c, type: 'course', date: c.completedAt, link: c.certificateLink, image: c.certificateImage || c.image}))];
      if (searchQuery) items = items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return items.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filterType, searchQuery]);

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event: any) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_SIZE = 400; 
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        setNewImage(canvas.toDataURL('image/jpeg', 0.9));
      }
    };
  };

  const handleSaveProfile = async () => {
      setIsSaving(true);
      const fd = new FormData();
      fd.append("name", newName);
      fd.append("image", newImage); 
      await updateUserProfile(fd);
      setData({ ...data, user: { ...data.user, name: newName, image: newImage } });
      toast.success(txt.toast_profile_updated || "Profile Updated ✨", {
        style: { background: "#101010", color: "#fff", border: "1px solid #333" }
      });
      setIsSaving(false);
      setIsEditing(false);
  };

  if (loading) return <div className="min-h-screen bg-[#020202] flex items-center justify-center text-cyan-500"><Loader2 className="animate-spin" size={40}/></div>;
  if (!data) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Error Loading Profile</div>;

  const { user, history, stats, completedBooks, completedProjects, completedCourses } = data;
  const featuredItems = filteredArchive.slice(0, 3);
  const repoItems = filteredArchive.slice(3);

  const rpgStats = {
      str: Math.min(stats.totalWorkouts * 2, 100), 
      int: Math.min(completedBooks.length * 10, 100), 
      dex: Math.min(completedProjects.length * 15, 100), 
      con: Math.min(user.currentStreak * 3, 100) 
  };

  const getDominantTheme = () => {
      const maxStat = Math.max(rpgStats.str, rpgStats.int, rpgStats.dex);
      if (maxStat === rpgStats.str) return { color: 'text-blue-500', border: 'border-blue-500', bg: 'bg-blue-500', glow: 'shadow-blue-500/20' }; 
      if (maxStat === rpgStats.int) return { color: 'text-purple-500', border: 'border-purple-500', bg: 'bg-purple-500', glow: 'shadow-purple-500/20' }; 
      if (maxStat === rpgStats.dex) return { color: 'text-green-500', border: 'border-green-500', bg: 'bg-green-500', glow: 'shadow-green-500/20' }; 
      return { color: 'text-cyan-500', border: 'border-cyan-500', bg: 'bg-cyan-500', glow: 'shadow-cyan-500/20' }; 
  };
  const theme = getDominantTheme();

  const badges = [];
  if (stats.totalWorkouts > 10) badges.push({ icon: Dumbbell, label: txt.badge_iron_will || "Iron Will", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" });
  if (completedBooks.length > 5) badges.push({ icon: Brain, label: txt.badge_scholar || "Scholar", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" });
  if (completedProjects.length > 2) badges.push({ icon: Layers, label: txt.badge_builder || "Builder", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" });
  if (user.currentStreak > 7) badges.push({ icon: Flame, label: txt.badge_unstoppable || "Unstoppable", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" });
  if (badges.length === 0) badges.push({ icon: Shield, label: txt.badge_initiate || "Initiate", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" });

  const xpDist = { fitness: stats.totalWorkouts * 200, knowledge: completedBooks.length * 500, dev: completedProjects.length * 1000 };
  const totalCalcXp = xpDist.fitness + xpDist.knowledge + xpDist.dev || 1;
  const getItemIcon = (type: string) => { if (type === 'book') return BookOpen; if (type === 'project') return Briefcase; return Award; };

  const daysInCurrentMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const startDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthName = currentDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });

  const calendarDays = [
      txt.cal_sun || "S", txt.cal_mon || "M", txt.cal_tue || "T", 
      txt.cal_wed || "W", txt.cal_thu || "T", txt.cal_fri || "F", txt.cal_sat || "S"
  ];

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#020202] text-white p-4 md:p-10 font-sans pb-32 relative overflow-x-hidden selection:bg-cyan-500/30" dir="ltr">
      
      {/* Background Ambience */}
      <div className={`fixed top-[-20%] left-[-10%] w-[800px] h-[800px] blur-[150px] rounded-full pointer-events-none opacity-20 transition-colors duration-1000 ${theme.bg}`} />
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all group border border-white/5">
              <ChevronLeft size={18} className={`group-hover:-translate-x-1 transition-transform ${lang === 'ar' ? 'rotate-180' : ''}`}/> 
              <span className="text-xs font-bold tracking-widest uppercase">{txt.back || "Back"}</span>
          </button>
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-mono text-gray-500 tracking-wider">ID: {user._id.slice(-6).toUpperCase()}</div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* LEFT COLUMN: Identity & Stats */}
          <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-8">
                  <div className={`bg-[#080808] border rounded-[32px] p-6 text-center relative overflow-hidden group shadow-2xl transition-colors duration-500 ${theme.border.replace('border-', 'border-opacity-20 border-')}`}>
                      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none" />
                      <div className={`absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${theme.color}`} />

                      {/* Avatar */}
                      <div className="relative w-32 h-32 mx-auto mb-4 group/avatar">
                          <div className={`absolute inset-0 rounded-full blur-xl opacity-30 ${theme.bg} group-hover/avatar:opacity-50 transition-opacity`}/>
                          <div className={`relative w-full h-full rounded-full p-1 border-2 border-dashed border-white/20 ${theme.color}`}>
                            {user.image ? <img src={user.image} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full bg-[#151515] rounded-full flex items-center justify-center text-4xl font-black">{user.name.charAt(0)}</div>}
                          </div>
                          <button onClick={() => setIsEditing(true)} className="absolute bottom-0 right-0 p-2.5 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg"><Edit3 size={14}/></button>
                      </div>
                      
                      <h2 className="text-2xl font-black mb-1 tracking-tight text-white">{user.name}</h2>
                      <div className="flex items-center justify-center gap-2 mb-8">
                          <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${theme.color} ${theme.border.replace('border-', 'border-opacity-30 border-')} bg-white/[0.03]`}>
                              <Shield size={12} fill="currentColor"/> {txt.prof_lvl || "Level"} {user.level}
                          </span>
                      </div>

                      {/* Stats */}
                      <div className="space-y-4 mb-8 text-left bg-[#121212] p-5 rounded-2xl border border-white/5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <AttributeBar label="STR" value={rpgStats.str} max={100} color="bg-blue-500" icon={Dumbbell} sub={txt.prof_stat_phys || "Physical"} />
                          <AttributeBar label="INT" value={rpgStats.int} max={100} color="bg-purple-500" icon={Brain} sub={txt.prof_stat_know || "Knowledge"} />
                          <AttributeBar label="DEX" value={rpgStats.dex} max={100} color="bg-green-500" icon={Target} sub={txt.prof_stat_skill || "Skill"} />
                          <AttributeBar label="CON" value={rpgStats.con} max={100} color="bg-orange-500" icon={Flame} sub={txt.prof_stat_stam || "Stamina"} />
                      </div>

                      {/* Badges */}
                      <div className="mb-8">
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-left pl-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{txt.prof_badges || "Earned Badges"}</h4>
                          <div className="flex flex-wrap gap-2 justify-center">
                              {badges.map((badge, i) => (
                                  <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${badge.bg} ${badge.border} border`}>
                                      <badge.icon size={12} className={badge.color} />
                                      <span className={`text-[9px] font-bold ${badge.color} uppercase`}>{badge.label}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Mini Stats */}
                      <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#121212] p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 group/stat hover:border-yellow-500/30 transition-colors">
                              <Trophy size={16} className="text-yellow-500 group-hover/stat:scale-110 transition-transform" />
                              <span className="text-lg font-black text-white">{Math.floor(user.xp)}</span>
                              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">{txt.prof_xp || "XP"}</span>
                          </div>
                          <div className="bg-[#121212] p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 group/stat hover:border-orange-500/30 transition-colors">
                              <Flame size={16} className="text-orange-500 group-hover/stat:scale-110 transition-transform" />
                              <span className="text-lg font-black text-white">{user.currentStreak}</span>
                              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">{txt.prof_streak || "Streak"}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8">
              {/* Tabs */}
              <div className="flex gap-6 mb-8 border-b border-white/10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <button onClick={() => setActiveTab('performance')} className={`pb-4 text-xs font-black tracking-[0.2em] uppercase transition-all relative ${activeTab === 'performance' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>
                      {txt.prof_tab_perf || "Performance"}
                      {activeTab === 'performance' && <motion.div layoutId="tabLine" className={`absolute bottom-0 left-0 w-full h-[2px] ${theme.bg}`} />}
                  </button>
                  <button onClick={() => setActiveTab('archive')} className={`pb-4 text-xs font-black tracking-[0.2em] uppercase transition-all relative ${activeTab === 'archive' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>
                      {txt.prof_tab_vault || "Vault"} <span className="ml-1 text-[10px] py-0.5 px-1.5 rounded bg-white/10 text-gray-300">{filteredArchive.length}</span>
                      {activeTab === 'archive' && <motion.div layoutId="tabLine" className={`absolute bottom-0 left-0 w-full h-[2px] ${theme.bg}`} />}
                  </button>
              </div>

              <AnimatePresence mode="wait">
                  {activeTab === 'performance' && (
                      <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                          
                          {/* Focus Bars */}
                          <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8">
                              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}><Activity size={14}/> {txt.prof_focus_dist || "Focus Distribution"}</h3>
                              <div className="flex h-6 w-full bg-[#151515] rounded-lg overflow-hidden mb-4 p-1">
                                  <div className="h-full rounded-md bg-blue-500 transition-all duration-1000" style={{ width: `${(xpDist.fitness / totalCalcXp) * 100}%` }} />
                                  <div className="h-full rounded-md bg-purple-500 transition-all duration-1000 border-l border-[#151515]" style={{ width: `${(xpDist.knowledge / totalCalcXp) * 100}%` }} />
                                  <div className="h-full rounded-md bg-green-500 transition-all duration-1000 border-l border-[#151515]" style={{ width: `${(xpDist.dev / totalCalcXp) * 100}%` }} />
                              </div>
                              <div className="flex gap-4 justify-center flex-wrap">
                                  <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] font-bold text-blue-200">FITNESS {Math.round((xpDist.fitness/totalCalcXp)*100)}%</span></div>
                                  <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-[10px] font-bold text-purple-200">KNOWLEDGE {Math.round((xpDist.knowledge/totalCalcXp)*100)}%</span></div>
                                  <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] font-bold text-green-200">DEV {Math.round((xpDist.dev/totalCalcXp)*100)}%</span></div>
                              </div>
                          </div>

                          {/* 2. Consistency Grid */}
                          <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 overflow-hidden">
                              <div className="flex items-center justify-between mb-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> {txt.prof_consist_grid || "Consistency Grid"}</h3>
                                  <div className="flex items-center gap-4 bg-[#151515] px-3 py-1.5 rounded-xl border border-white/5" dir="ltr">
                                      <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-white transition-colors"><ChevronLeft size={16}/></button>
                                      <span className="text-xs font-bold text-white uppercase min-w-[80px] text-center">{monthName}</span>
                                      <button onClick={() => changeMonth(1)} className="text-gray-400 hover:text-white transition-colors"><ChevronRight size={16}/></button>
                                  </div>
                              </div>
                              
                              <div className="w-full max-w-sm mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                                  <div className="grid grid-cols-7 gap-1.5">
                                      {calendarDays.map((d, i) => (
                                          <div key={i} className="text-center text-[10px] text-gray-600 font-bold mb-2 uppercase">{d}</div>
                                      ))}
                                      {Array.from({ length: startDay }).map((_, i) => (
                                          <div key={`empty-${i}`} className="w-full aspect-square" />
                                      ))}
                                      {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                                          const day = i + 1;
                                          const isActive = isDayActive(day);
                                          const activeClass = isActive 
                                              ? `${theme.bg} shadow-[0_0_10px_rgba(255,255,255,0.4)] border-white/50 text-white` 
                                              : 'bg-[#151515] border-white/5 text-gray-600 hover:bg-[#1a1a1a]';
                                      
                                          return (
                                              <motion.div 
                                                  key={day} 
                                                  initial={{ scale: 0.8, opacity: 0 }}
                                                  animate={{ scale: 1, opacity: 1 }}
                                                  transition={{ delay: i * 0.01 }}
                                                  className={`relative group w-full aspect-square rounded-md border ${activeClass} flex items-center justify-center transition-all duration-300 font-mono text-[10px] font-bold cursor-default`}
                                              >
                                                  {day}
                                                  {isActive && (
                                                      <div className="absolute bottom-full mb-2 px-2 py-1 bg-black border border-white/10 text-[9px] text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                          {txt.active || "Active"}
                                                      </div>
                                                  )}
                                              </motion.div>
                                          )
                                      })}
                                  </div>
                              </div>
                          </div>

                          {/* 3. System Logs */}
                          <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                              <div className="flex justify-between items-center mb-4 pl-2">
                                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{txt.prof_sys_logs || "System Logs"}</h3>
                                  <span className="text-[9px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded">LATEST</span>
                              </div>
                              <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                                  <div className="relative border-l border-white/10 ml-4 space-y-4 pl-6 pb-2" style={{ marginRight: lang === 'ar' ? '1rem' : '0', marginLeft: lang === 'ar' ? '0' : '1rem', borderLeftWidth: lang === 'ar' ? '0' : '1px', borderRightWidth: lang === 'ar' ? '1px' : '0', paddingLeft: lang === 'ar' ? '0' : '1.5rem', paddingRight: lang === 'ar' ? '1.5rem' : '0' }}>
                                      {history.map((item: any, i: number) => {
                                          const { icon: Icon, color, bg, border, label } = getLogIcon(item);
                                          return (
                                              <div key={i} className="relative group">
                                                  <div className={`absolute top-4 w-2 h-2 rounded-full bg-[#1A1A1A] border border-white/20 group-hover:bg-white group-hover:border-white transition-colors ${lang === 'ar' ? '-right-[29px]' : '-left-[29px]'}`} />
                                                  <div className="flex items-center justify-between bg-[#0A0A0A] border border-white/5 p-3 rounded-2xl hover:border-white/10 transition-colors hover:bg-white/[0.02]">
                                                      <div className="flex items-center gap-4">
                                                          <div className={`p-2 rounded-xl ${bg} ${color}`}>
                                                              <Icon size={16} />
                                                          </div>
                                                          <div>
                                                              <div className="flex items-center gap-2 mb-0.5">
                                                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${color.replace('text-', 'bg-').replace('400', '500')}/10 px-1.5 py-0.5 rounded`}>{label}</span>
                                                                  <span className="text-[9px] text-gray-600 font-mono">{formatLogDate(item.date)}</span>
                                                              </div>
                                                              <div className="text-sm font-bold text-gray-200 line-clamp-1">{item.title}</div>
                                                          </div>
                                                      </div>
                                                      <div className={`text-xs font-bold font-mono px-3 py-1 rounded-lg bg-[#151515] border border-white/5 ${color}`}>+{item.xp} XP</div>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  )}
                  
                  {activeTab === 'archive' && (
                      <motion.div key="archive" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <div className="flex flex-col md:flex-row gap-4 bg-[#0A0A0A] p-4 rounded-2xl border border-white/10">
                              <div className="relative flex-1">
                                  <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-500 ${lang === 'ar' ? 'right-3' : 'left-3'}`} size={16}/>
                                  <input placeholder={txt.prof_search_ph || "Search..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full bg-[#151515] border border-white/5 rounded-xl py-2 ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-white focus:outline-none focus:border-white/20 transition-colors`}/>
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                                  <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${filterType === 'all' ? 'bg-white text-black' : 'bg-[#151515] text-gray-400'}`}>{txt.prof_filter_all || "All"}</button>
                                  <button onClick={() => setFilterType('books')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${filterType === 'books' ? 'bg-purple-500 text-white' : 'bg-[#151515] text-gray-400'}`}>{txt.prof_filter_books || "Books"}</button>
                                  <button onClick={() => setFilterType('projects')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${filterType === 'projects' ? 'bg-green-500 text-black' : 'bg-[#151515] text-gray-400'}`}>{txt.prof_filter_proj || "Projects"}</button>
                                  <button onClick={() => setFilterType('courses')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${filterType === 'courses' ? 'bg-yellow-500 text-black' : 'bg-[#151515] text-gray-400'}`}>{txt.prof_filter_cert || "Certs"}</button>
                                  <div className="w-[1px] h-full bg-white/10 mx-1"></div>
                                  <button onClick={() => setArchiveView(archiveView === 'grid' ? 'list' : 'grid')} className="p-2 bg-[#151515] rounded-xl text-gray-400 hover:text-white">{archiveView === 'grid' ? <LayoutList size={16}/> : <LayoutGrid size={16}/>}</button>
                              </div>
                          </div>
                          
                          <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                              {repoItems.length === 0 ? <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl text-gray-600">{txt.prof_nothing || "Empty"}</div> : archiveView === 'grid' ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {repoItems.map((item: any) => {
                                          const Icon = getItemIcon(item.type);
                                          return (
                                              <div key={item._id} className="bg-[#0A0A0A] border border-white/5 p-3 rounded-2xl hover:border-white/20 transition-all group hover:-translate-y-1">
                                                  {/* ✅ التغيير هنا: aspect-[3/4] لجعل الصور طولية */}
                                                  <div className="aspect-[3/4] bg-[#151515] rounded-xl mb-3 overflow-hidden relative border border-white/5">
                                                      
                                                      {/* 🏷️ TAG (Solid Dark, Transparent on Hover) */}
                                                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-md border z-10 transition-all duration-300 font-bold tracking-wider text-[8px] uppercase
                                                          ${item.type === 'book'
                                                              ? 'bg-zinc-900 border-purple-500/50 text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-200'
                                                              : item.type === 'project'
                                                              ? 'bg-zinc-900 border-green-500/50 text-green-400 group-hover:bg-green-500/20 group-hover:text-green-200'
                                                              : 'bg-zinc-900 border-yellow-500/50 text-yellow-400 group-hover:bg-yellow-500/20 group-hover:text-yellow-200'
                                                          }
                                                      `}>
                                                          {item.type === 'book' ? (txt.prof_filter_books || "Book") :
                                                           item.type === 'project' ? (txt.prof_filter_proj || "Project") :
                                                           (txt.prof_filter_cert || "Course")}
                                                      </div>

                                                      {item.image ? <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"/> : <div className="w-full h-full flex items-center justify-center"><Icon size={24} className="text-gray-700"/></div>}
                                                      {(item.link || item.githubLink) && <a href={item.link || item.githubLink} target="_blank" className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={12}/></a>}
                                                  </div>
                                                  <h4 className="font-bold text-xs text-gray-300 truncate">{item.title}</h4>
                                                  <p className="text-[9px] text-gray-600 uppercase mt-1">{new Date(item.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                              </div>
                                          )
                                      })}
                                  </div>
                              ) : (
                                  <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden">
                                      {repoItems.map((item: any, i: number) => {
                                          const Icon = getItemIcon(item.type);
                                          return (
                                              <div key={item._id} className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${i !== repoItems.length-1 ? 'border-b border-white/5' : ''}`}>
                                                  <div className="flex items-center gap-4">
                                                      <div className={`p-2 rounded-lg ${item.type === 'book' ? 'bg-purple-500/10 text-purple-500' : item.type === 'course' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}><Icon size={16}/></div>
                                                      <div>
                                                          <h4 className="font-bold text-sm text-gray-200">{item.title}</h4>
                                                          <p className="text-[10px] text-gray-500 font-mono">{new Date(item.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                                      </div>
                                                  </div>
                                                  {(item.link || item.githubLink) && <a href={item.link || item.githubLink} target="_blank" className="text-gray-500 hover:text-white transition-colors"><ExternalLink size={16}/></a>}
                                              </div>
                                          )
                                      })}
                                  </div>
                              )}
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
      </div>

      <AnimatePresence>
        {isEditing && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#0F0F0F] border border-white/10 p-1 rounded-[32px] w-full max-w-sm relative shadow-2xl" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="bg-[#0F0F0F] p-6 rounded-[30px] relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent ${theme.color}`} />
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-black text-lg text-white">{txt.prof_edit || "Edit Profile"}</h3>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18} className="text-gray-400 hover:text-white"/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative group cursor-pointer w-28 h-28">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                                    <div className={`w-full h-full rounded-full overflow-hidden border-2 border-dashed border-white/20 transition-colors bg-[#151515] flex items-center justify-center relative hover:border-current ${theme.color}`}>
                                        {newImage ? <img src={newImage} className="w-full h-full object-cover" /> : <Camera className="text-gray-600" size={32} />}
                                    </div>
                                </div>
                                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{txt.prof_upload || "Upload"}</span>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.prof_codename || "Name"}</label>
                                <input value={newName} onChange={(e) => setNewName(e.target.value)} className={`w-full bg-[#1A1A1A] border border-white/10 p-4 rounded-xl outline-none text-white mt-1 text-sm font-bold transition-all focus:border-current ${theme.color}`} />
                            </div>
                            <button onClick={handleSaveProfile} disabled={isSaving} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-sm text-white ${theme.bg} hover:opacity-90`}>
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : (txt.prof_save || "Save")}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AttributeBar({ label, value, max, color, icon: Icon, sub }: any) {
    const percent = Math.min((value / max) * 100, 100);
    return (
        <div>
            <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-1.5 text-gray-300">
                    <Icon size={12} className="opacity-70"/>
                    <span className="text-xs font-bold font-mono">{label}</span>
                </div>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{sub}</span>
            </div>
            <div className="h-1.5 w-full bg-[#0A0A0A] rounded-full overflow-hidden border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1, ease: "circOut" }} className={`h-full ${color} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]`}/>
            </div>
        </div>
    );
}