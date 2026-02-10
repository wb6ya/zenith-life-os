"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCircle, Flame, Trophy, Lock, Flag, Plus,
    Layers, Calendar, Activity, ChevronRight, X, 
    NotebookPen, Loader2, Trash2, CheckSquare, Square, Sparkles,
    Check, History
} from "lucide-react";
import { completeTask, createMilestone, toggleMilestoneStep, deleteMilestone } from "@/app/actions";
import useSound from "use-sound";
import confetti from "canvas-confetti";
import { useLanguage } from "@/context/LanguageContext";
// ✅ استيراد ملف الترجمة الأصلي للبحث العكسي
import { translations } from "@/context/translations"; 
import { format, differenceInDays, endOfYear, startOfYear } from "date-fns";

import ProductivityHub from "./ProductivityHub";

// --- COMPONENTS ---

const RealisticFire = ({ isDead = false }) => {
    useEffect(() => {
        if (document.querySelector('script[src*="dotlottie-wc"]')) return;
        const script = document.createElement('script');
        script.src = "https://unpkg.com/@lottiefiles/dotlottie-wc@0.8.11/dist/dotlottie-wc.js";
        script.type = "module";
        document.body.appendChild(script);
    }, []);
    return (
        <div className="relative w-[220px] h-[220px] flex items-center justify-center">
             {/* @ts-ignore */} 
             <dotlottie-wc src="https://lottie.host/c6ec726a-4630-45bc-ab7b-b07ca604a4d7/MF57zI62Tt.lottie" autoplay loop style={{ width: '100%', height: '100%', filter: isDead ? 'grayscale(1)' : 'none', opacity: isDead ? 0.5 : 1 }}></dotlottie-wc>
        </div>
    );
};

const SoulOverlay = ({ type, txt, onClose }: any) => {
    const isIgnited = type === 'ignited';
    useEffect(() => { const timer = setTimeout(onClose, 6000); return () => clearTimeout(timer); }, [onClose]);
    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm" onClick={onClose}>
            <div className="relative flex flex-col items-center">
                <div className="mb-12 relative scale-150"><RealisticFire isDead={!isIgnited} /></div>
                <motion.h1 className={`text-5xl md:text-8xl font-black tracking-widest uppercase py-6 drop-shadow-2xl ${isIgnited ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-600' : 'text-gray-500'}`} style={{ fontFamily: 'serif' }} initial={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }} animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}>
                    {isIgnited ? (txt.soul_streak_ignited || "SOUL IGNITED") : (txt.soul_streak_faded || "SOUL FADED")}
                </motion.h1>
            </div>
        </motion.div>, 
        document.body
    );
};

// 🏆 Victory Overlay
const VictoryOverlay = ({ txt, onClose, lang }: any) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500', '#FFFFFF'] });
        return () => clearTimeout(timer);
    }, [onClose]);

    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center cursor-pointer backdrop-blur-md" onClick={onClose} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="relative flex flex-col items-center">
                <div className="absolute inset-0 bg-yellow-500/20 blur-[150px] rounded-full animate-pulse" />
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 15 }} className="relative z-10 mb-8 p-10 bg-gradient-to-br from-yellow-300/20 to-yellow-600/10 rounded-full border border-yellow-500/50 shadow-[0_0_100px_rgba(234,179,8,0.4)]">
                    <Trophy size={120} className="text-yellow-400 drop-shadow-2xl" strokeWidth={1} />
                </motion.div>
                <motion.h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-700 drop-shadow-2xl" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    {txt.milestone_completed || "MILESTONE CONQUERED"}
                </motion.h1>
                <motion.p className="text-yellow-200/60 font-mono tracking-[0.5em] mt-4 uppercase text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    {txt.great_job || "LEGENDARY PERFORMANCE"}
                </motion.p>
            </div>
        </motion.div>, 
        document.body
    );
};

const YearProgress = ({ txt, lang }: any) => { const today = new Date(); const start = startOfYear(today); const end = endOfYear(today); const totalDays = differenceInDays(end, start) + 1; const daysPassed = differenceInDays(today, start) + 1; const daysLeft = totalDays - daysPassed; const progress = (daysPassed / totalDays) * 100; return (<div className="w-full bg-[#121212] border border-white/10 rounded-2xl p-6 mb-6 relative overflow-hidden group"><div className="absolute top-0 right-0 w-[300px] h-full bg-blue-900/10 blur-[80px] group-hover:bg-blue-800/20 transition-all duration-1000" /><div className="flex justify-between items-end mb-4 relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}><div><h3 className="text-xl font-black text-white tracking-tighter uppercase flex items-center gap-2"><Calendar size={20} className="text-blue-500" /> {today.getFullYear()}</h3><p className="text-[10px] text-gray-500 font-mono mt-1">{format(today, 'EEEE, MMMM do')}</p></div><div className="text-right"><span className="text-2xl font-black text-white">{progress.toFixed(1)}%</span><p className="text-[9px] text-gray-500 uppercase tracking-widest">{txt.year_progress}</p></div></div><div className="h-4 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 relative"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5, ease: "circOut" }} className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-white rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)] relative"><div className="absolute inset-0 bg-white/20 animate-pulse" /></motion.div></div><div className="flex justify-between mt-3 text-[10px] font-bold text-gray-600 uppercase relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}><span>{daysPassed} {txt.year_passed}</span><span>{daysLeft} {txt.year_remaining}</span></div></div>); };
const StatCard = ({ icon: Icon, label, value, color, delay }: any) => ( <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay }} className={`bg-[#151515] border border-white/5 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group`}><div className={`absolute right-0 top-0 w-24 h-full bg-gradient-to-l ${color} opacity-5 group-hover:opacity-10 transition-opacity`} /><div className={`p-3 rounded-xl bg-white/5 ${color.replace('from-', 'text-').split(' ')[0]}`}><Icon size={20} /></div><div><h4 className="text-2xl font-black text-white">{value}</h4><p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</p></div></motion.div> );

export default function TaskCenter({ tasks, milestones = [], userStreak, userLevel, yearlyStats = { daily: 0, weekly: 0, monthly: 0, goals: 0 } }: any) {
    const { t, lang } = useLanguage();
    // @ts-ignore
    const txt = t || {}; // تجنب الأخطاء في حال كانت الترجمة غير محملة

    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [localTasks, setLocalTasks] = useState(tasks);
    const [localMilestones, setLocalMilestones] = useState(milestones);
    const [milestoneView, setMilestoneView] = useState<'active' | 'completed'>('active');
    
    const [streak, setStreak] = useState(userStreak);
    const [soulState, setSoulState] = useState<'ignited' | 'faded' | null>(null);
    const [showVictory, setShowVictory] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [celebratedIds, setCelebratedIds] = useState<Set<string>>(new Set());

    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newMilestoneSteps, setNewMilestoneSteps] = useState<{title: string, xp: number}[]>([]);
    const [currentStepInput, setCurrentStepInput] = useState("");
    const [currentXPInput, setCurrentXPInput] = useState(100);

    const [isHubOpen, setIsHubOpen] = useState(false);

    const [playCheck] = useSound('/sounds/click.mp3', { volume: 0.5 });
    const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.6 });
    const [playIgnite] = useSound('/sounds/bonfire_lit.mp3', { volume: 1.0 }); 
    const [playOpen] = useSound('/sounds/click.mp3', { volume: 0.3 }); 
    const [playFade] = useSound('/sounds/you_died.mp3', { volume: 1.0 }); 
    const [playVictory] = useSound('/sounds/success.mp3', { volume: 0.8 }); 

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { setLocalTasks(tasks); }, [tasks]);
    useEffect(() => { setLocalMilestones(milestones); }, [milestones]);

    useEffect(() => {
        if (soulState === 'faded') playFade();
        else if (soulState === 'ignited') playIgnite();
    }, [soulState, playFade, playIgnite]);

    useEffect(() => { if (showVictory) playVictory(); }, [showVictory, playVictory]);

    // 🔥 دالة الترجمة الذكية مع دعم البحث العكسي (Reverse Lookup)
    const translateContent = (text: string, type: 'title' | 'category') => {
        if (!text) return "";

        // 1. ترجمة التصنيفات (مثلاً: fitness -> cat_fitness)
        if (type === 'category') { 
            const key = `cat_${text.toLowerCase()}`; 
            // @ts-ignore
            return txt[key] || text; 
        }

        // 2. إذا كان النص يحتوي على بادئة (Prefix)، نترجم البادئة فقط
        if (text.includes(':')) {
            const [prefix, ...rest] = text.split(':');
            const variablePart = rest.join(':').trim();
            // @ts-ignore
            const translatedPrefix = txt[prefix];
            if (translatedPrefix) return `${translatedPrefix}: ${variablePart}`;
        }

        // 3. محاولة الترجمة المباشرة (إذا كان النص هو المفتاح نفسه)
        // @ts-ignore
        if (txt[text]) return txt[text];

        // 4. 🔥 البحث العكسي: إذا كان النص إنجليزي محفوظ في الداتا، نبحث عن مفتاحه
        // هذا يحل مشكلة المهام الأسبوعية والشهرية القديمة
        const enKeys = translations.en as Record<string, string>;
        const foundKey = Object.keys(enKeys).find(key => enKeys[key] === text);
        
        // إذا وجدنا المفتاح المقابل للنص الإنجليزي، نستخدمه لجلب النص العربي
        // @ts-ignore
        if (foundKey && txt[foundKey]) {
            // @ts-ignore
            return txt[foundKey];
        }

        // 5. إذا فشل كل شيء، أعد النص كما هو
        return text; 
    };

    const handleCompleteTask = async (taskId: string) => {
        playCheck();
        const updated = { ...localTasks };
        updated[activeTab] = updated[activeTab].map((t: any) => t._id === taskId ? { ...t, isCompleted: true } : t);
        setLocalTasks(updated);
        const res = await completeTask(taskId);
        if (res.success) { 
            if (res.streakUpdated) { setStreak(res.newStreakValue); setSoulState('ignited'); } 
            else { playSuccess(); confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: ['#f97316'] }); } 
        }
    };

    const addStepToDraft = (e: any) => {
        e.preventDefault();
        if(!currentStepInput.trim()) return;
        let safeXP = currentXPInput;
        if (safeXP > 5000) safeXP = 5000;
        if (safeXP < 10) safeXP = 10;
        setNewMilestoneSteps([...newMilestoneSteps, { title: currentStepInput, xp: safeXP }]);
        setCurrentStepInput("");
        setCurrentXPInput(100);
    };

    const removeStepFromDraft = (idx: number) => {
        setNewMilestoneSteps(newMilestoneSteps.filter((_, i) => i !== idx));
    };

    const handleAddMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); 
        if(newMilestoneSteps.length === 0) return;
        setIsSubmitting(true);
        const fd = new FormData(e.currentTarget);
        const title = fd.get("title") as string;
        
        const tempId = Date.now().toString();
        const newMilestone = {
            _id: tempId, title: title,
            steps: newMilestoneSteps.map(s => ({ ...s, isCompleted: false })),
            xpReward: 1000, isCompleted: false
        };

        setLocalMilestones([...localMilestones, newMilestone]);
        setIsMilestoneModalOpen(false);
        setNewMilestoneSteps([]);
        playSuccess();

        fd.set("steps", JSON.stringify(newMilestoneSteps));
        await createMilestone(fd);
        setIsSubmitting(false);
    };

    const handleStepToggle = async (mId: string, stepTitle: string) => {
        playCheck();
        let milestoneCompleted = false;
        const updated = localMilestones.map((m: any) => { 
            if (m._id === mId) { 
                const newSteps = m.steps.map((s: any) => s.title === stepTitle ? { ...s, isCompleted: true } : s); 
                const allDone = newSteps.every((s:any) => s.isCompleted);
                if (allDone && !m.isCompleted && !celebratedIds.has(m._id)) { milestoneCompleted = true; }
                return { ...m, steps: newSteps, isCompleted: allDone }; 
            } 
            return m; 
        });
        setLocalMilestones(updated);
        await toggleMilestoneStep(mId, stepTitle);
        if (milestoneCompleted) { setShowVictory(true); setCelebratedIds(prev => new Set(prev).add(mId)); }
    };

    const handleDeleteMilestone = async (id: string) => {
        setLocalMilestones(localMilestones.filter((m:any) => m._id !== id));
        await deleteMilestone(id);
    };

    const toggleHub = () => { playOpen(); setIsHubOpen(!isHubOpen); };
    const currentList = localTasks[activeTab] || [];
    const isLocked = (activeTab === 'weekly' || activeTab === 'monthly') && userLevel < 5;
    const filteredMilestones = localMilestones.filter((m: any) => milestoneView === 'active' ? !m.isCompleted : m.isCompleted);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            <AnimatePresence>
                {soulState && <SoulOverlay type={soulState} txt={txt} onClose={() => setSoulState(null)} />}
                {showVictory && <VictoryOverlay txt={txt} onClose={() => setShowVictory(false)} lang={lang} />}
            </AnimatePresence>

            <YearProgress txt={txt} lang={lang} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 📝 Tasks */}
                <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-[32px] p-6 flex flex-col h-[600px] relative">
                    <div className="flex-none flex justify-between items-center bg-[#121212] p-2 rounded-2xl border border-white/5 relative z-10 mb-4">
                        <div className="flex gap-2">
                            {['daily', 'weekly', 'monthly'].map((tab: any) => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                                    {/* @ts-ignore */}
                                    {txt[`tasks_${tab}`]}
                                </button>
                            ))}
                        </div>
                        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${streak > 0 ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-white/5 border-white/5 text-gray-600'}`}>
                            <Flame size={16} fill="currentColor" className={streak > 0 ? "animate-pulse" : ""} />
                            <span className="text-sm font-black font-mono">{streak}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pl-2" style={{ direction: 'rtl' }}>
                        <div style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }} className="space-y-3 pb-4">
                            <AnimatePresence mode="popLayout">
                                {isLocked ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-60 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl gap-4 text-gray-600">
                                        <Lock size={48} /><p className="text-sm font-bold uppercase tracking-[0.3em]">{txt.tasks_locked}</p>
                                    </motion.div>
                                ) : currentList.length > 0 ? (
                                    currentList.map((task: any) => (
                                        <motion.div layout key={task._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`group p-5 rounded-2xl border transition-all flex items-center justify-between ${task.isCompleted ? 'bg-[#0A0A0A] border-green-500/10 opacity-50' : 'bg-[#151515] border-white/5 hover:border-white/10'}`}>
                                            <div className="flex items-center gap-5">
                                                <button onClick={() => !task.isCompleted && handleCompleteTask(task._id)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${task.isCompleted ? 'bg-green-500 border-green-500 text-black' : 'border-gray-600 hover:border-white text-transparent'}`}>
                                                    <CheckCircle size={16} fill={task.isCompleted ? "currentColor" : "none"} />
                                                </button>
                                                <div>
                                                    {/* ✅ استخدام الدالة الذكية للترجمة */}
                                                    <h4 className={`font-bold text-base transition-all ${task.isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>{translateContent(task.title, 'title')}</h4>
                                                    <div className="flex items-center gap-2 mt-1.5"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${getCategoryColor(task.category)}`}>{translateContent(task.category, 'category')}</span><span className="text-[10px] text-yellow-500 font-mono flex items-center gap-1"><Trophy size={10}/> +{task.xpReward} XP</span></div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-gray-500"><CheckCircle size={32} className="mx-auto mb-3 opacity-30"/><p className="text-sm font-bold tracking-widest">{txt.tasks_empty}</p></div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* 🏆 Milestones Right Panel */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-6 flex flex-col h-[600px] relative">
                    <div className="flex-none flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setMilestoneView('active')} className={`text-sm font-black flex items-center gap-2 transition-colors ${milestoneView === 'active' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>
                                <Flag size={18} className={milestoneView === 'active' ? "text-yellow-500" : "text-gray-600"}/> {txt.tasks_active_tab}
                            </button>
                            <span className="text-gray-700">/</span>
                            <button onClick={() => setMilestoneView('completed')} className={`text-sm font-black flex items-center gap-2 transition-colors ${milestoneView === 'completed' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>
                                <History size={18} className={milestoneView === 'completed' ? "text-green-500" : "text-gray-600"}/> {txt.tasks_history_tab}
                            </button>
                        </div>
                        <button onClick={() => setIsMilestoneModalOpen(true)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all shadow-lg shadow-blue-900/20"><Plus size={16}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pl-2" style={{ direction: 'rtl' }}>
                        <div style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }} className="space-y-6 pb-4">
                            {filteredMilestones.length > 0 ? (
                                filteredMilestones.map((m: any) => {
                                    if (milestoneView === 'completed') {
                                        return (
                                            <div key={m._id} className="bg-[#0f0f0f] border border-green-500/20 p-4 rounded-2xl opacity-80 hover:opacity-100 transition-all">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-bold text-sm text-green-500 line-through decoration-green-800">{m.title}</h4>
                                                    <div className="bg-green-900/20 text-green-500 p-1 rounded-full"><Check size={14}/></div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                                                    <Calendar size={12}/> {txt.tasks_completed_on} {new Date(m.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                                                </div>
                                            </div>
                                        );
                                    }

                                    const activeSteps = m.steps.filter((s:any) => !s.isCompleted);
                                    const completedSteps = m.steps.filter((s:any) => s.isCompleted);
                                    const total = m.steps.length;
                                    const done = completedSteps.length;
                                    const percentage = total === 0 ? 0 : (done / total) * 100;
                                    
                                    return (
                                        <div key={m._id} className="bg-[#151515] border border-white/5 p-4 rounded-2xl group transition-all relative overflow-hidden hover:border-yellow-500/20">
                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <h4 className="font-bold text-sm text-white leading-tight">{m.title}</h4>
                                                <button onClick={() => handleDeleteMilestone(m._id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                            </div>
                                            
                                            <div className="w-full h-1.5 bg-black rounded-full mb-4 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${percentage}%` }} /></div>
                                            
                                            <div className="space-y-1 relative z-10 mb-2">
                                                {activeSteps.length > 0 ? activeSteps.map((step: any, idx: number) => (
                                                    <button key={`active-${idx}`} onClick={() => handleStepToggle(m._id, step.title)} className="flex items-center justify-between w-full text-left rtl:text-right group/step hover:bg-white/[0.04] p-1.5 rounded-lg transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <Square size={14} className="text-gray-600 group-hover/step:text-gray-400 mt-0.5 flex-shrink-0"/>
                                                            <span className="text-[11px] leading-tight text-gray-300">{step.title}</span>
                                                        </div>
                                                        <span className="text-[9px] font-mono text-gray-600 flex items-center gap-0.5"><Sparkles size={8} className="text-yellow-600"/> {step.xp || 100} XP</span>
                                                    </button>
                                                )) : <p className="text-[10px] text-gray-500">{txt.tasks_no_steps}</p>}
                                            </div>

                                            {completedSteps.length > 0 && (
                                                <div className="mt-4 pt-2 border-t border-white/5">
                                                    <p className="text-[9px] font-bold text-gray-600 uppercase mb-2 ml-1 flex items-center gap-1"><Lock size={8}/> {txt.tasks_milestone_done}</p>
                                                    <div className="space-y-1 opacity-50">
                                                        {completedSteps.map((step: any, idx: number) => (
                                                            <div key={`done-${idx}`} className="flex items-center justify-between w-full text-left rtl:text-right p-1.5 rounded-lg cursor-not-allowed">
                                                                <div className="flex items-center gap-3">
                                                                    <CheckSquare size={14} className="text-green-600 mt-0.5 flex-shrink-0"/>
                                                                    <span className="text-[11px] leading-tight text-gray-500 line-through decoration-gray-700">{step.title}</span>
                                                                </div>
                                                                <span className="text-[9px] font-mono text-green-700 flex items-center gap-0.5"><Check size={8}/> {txt.tasks_step_done}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            ) : <div className="text-center py-10 text-gray-600 text-xs">{txt.tasks_no_items} {milestoneView}.</div>}
                        </div>
                    </div>
                </div>
            </div>

            {mounted && createPortal(
                <div className="fixed top-1/2 -translate-y-1/2 z-[9999] right-0 translate-x-[2px]">
                    <motion.button onClick={toggleHub} initial={{ x: 30 }} animate={{ x: 0 }} whileHover={{ x: -5, scale: 1.05 }} className="h-24 w-8 flex items-center justify-center bg-[#151515]/90 backdrop-blur-md border-y border-l border-white/20 border-r-0 rounded-l-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] group cursor-pointer overflow-hidden">
                        <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_#3b82f6]" />
                        <div className="text-gray-400 group-hover:text-white transition-colors">{isHubOpen ? <ChevronRight size={18} /> : <NotebookPen size={18} />}</div>
                    </motion.button>
                </div>, document.body
            )}

            {mounted && createPortal(
                <AnimatePresence>
                    {isHubOpen && (
                        <>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHubOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-all" />
                            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed top-4 bottom-4 right-4 w-full sm:w-[380px] z-[9999] rounded-[32px] shadow-2xl overflow-hidden border border-white/10">
                                <button onClick={() => setIsHubOpen(false)} className="absolute top-6 left-6 p-2 bg-black/40 text-white/70 rounded-full z-[10000] hover:bg-red-500/80 hover:text-white transition-all backdrop-blur-md"><X size={20}/></button>
                                <div className="h-full w-full bg-[#0A0A0A]"><ProductivityHub /></div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>, document.body
            )}

            <div className="mt-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Activity size={14}/> {txt.stats_title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={CheckCircle} label={txt.stats_daily} value={yearlyStats.daily || 0} color="from-blue-600 to-transparent" delay={0.1} />
                    <StatCard icon={Layers} label={txt.stats_weekly} value={yearlyStats.weekly || 0} color="from-purple-600 to-transparent" delay={0.2} />
                    <StatCard icon={Calendar} label={txt.stats_monthly} value={yearlyStats.monthly || 0} color="from-green-600 to-transparent" delay={0.3} />
                    <StatCard icon={Flag} label={txt.stats_milestones} value={yearlyStats.goals || 0} color="from-yellow-600 to-transparent" delay={0.4} />
                </div>
            </div>

            {mounted && createPortal(
                <AnimatePresence>
                    {isMilestoneModalOpen && (
                        <motion.div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            <motion.div initial={{scale:0.9, y: 20}} animate={{scale:1, y: 0}} exit={{scale:0.9, y: 20}} className="bg-[#151515] border border-white/10 p-8 rounded-[32px] w-full max-w-lg shadow-2xl relative" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                                <button onClick={() => setIsMilestoneModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white"><X size={18}/></button>
                                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><Trophy size={24} className="text-yellow-500"/> {txt.tasks_new_goal}</h3>
                                <form onSubmit={handleAddMilestone} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.tasks_goal_label}</label>
                                        <input name="title" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-yellow-500 transition-colors text-lg" placeholder={txt.tasks_placeholder_title} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 flex justify-between">
                                            <span>{txt.tasks_steps_label}</span>
                                            <span className="text-yellow-500">{newMilestoneSteps.length} {txt.tasks_added_count}</span>
                                        </label>
                                        <div className="bg-black/20 rounded-xl p-2 max-h-40 overflow-y-auto custom-scrollbar space-y-2 mb-2">
                                            {newMilestoneSteps.length === 0 ? <p className="text-center text-gray-600 text-xs py-4">{txt.tasks_no_steps}</p> : (
                                                newMilestoneSteps.map((s, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-lg px-3">
                                                        <span className="text-sm text-gray-300">{s.title}</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-mono text-yellow-500">+{s.xp} XP</span>
                                                            <button type="button" onClick={() => removeStepFromDraft(i)} className="text-gray-500 hover:text-red-500"><X size={14}/></button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <input value={currentStepInput} onChange={(e) => setCurrentStepInput(e.target.value)} className="flex-1 bg-black/30 border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-blue-500" placeholder={txt.tasks_step_ph}/>
                                            <input type="number" max={5000} value={currentXPInput} onChange={(e) => setCurrentXPInput(Number(e.target.value))} className="w-20 bg-black/30 border border-white/10 p-3 rounded-xl text-white text-sm outline-none focus:border-blue-500 text-center font-mono" placeholder="XP"/>
                                            <button type="button" onClick={addStepToDraft} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"><Plus size={18}/></button>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isSubmitting || newMilestoneSteps.length === 0} className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg shadow-yellow-900/20 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100">
                                        {isSubmitting ? <Loader2 className="animate-spin"/> : (<><Sparkles size={18} fill="black"/> {txt.tasks_create_btn}</>)}
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>, document.body
            )}
        </div>
    );
}

function getCategoryColor(cat: string) {
    switch(cat) {
        case 'fitness': return 'bg-blue-500/10 text-blue-400';
        case 'project': return 'bg-indigo-500/10 text-indigo-400';
        case 'reading': return 'bg-pink-500/10 text-pink-400';
        case 'learning': return 'bg-cyan-500/10 text-cyan-400';
        default: return 'bg-gray-500/10 text-gray-400';
    }
}