"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, Edit, PlayCircle, Loader2, 
  Activity, X, ArrowRight, Home, Globe, Calendar, CheckCircle, LayoutGrid, Zap, RefreshCw,
  Dumbbell, ShieldCheck, Timer
} from "lucide-react";
import { createWorkoutPlan, getUserPlans, deleteWorkoutPlan, activateWorkoutPlan } from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import useSound from "use-sound";

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { staggerChildren: 0.1 } 
    }
};

const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
        y: 0, opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 15 } 
    }
};

const modalVar = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0.4 } },
    exit: { opacity: 0, scale: 0.95, y: 20 }
};

export default function FitnessHub() {
  const router = useRouter();
  const { setLang, lang, t } = useLanguage();
  const txt = t || {};

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, planId: "" });

  // Sounds
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
  const [playDelete] = useSound('/sounds/delete.mp3', { volume: 0.5 });
  const [playHover] = useSound('/sounds/hover.mp3', { volume: 0.05 });
  const [playActivate] = useSound('/sounds/levelup.mp3', { volume: 0.6 });

  // Load Plans
  const loadPlans = useCallback(async () => {
    try {
        setLoading(true);
        const res = await getUserPlans();
        if (res.success && Array.isArray(res.plans)) {
            setPlans(res.plans);
        } else {
            setPlans([]);
        }
    } catch (e) {
        console.error("Error fetching plans:", e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    router.refresh(); 
  }, [loadPlans, router]);

  const handleCreate = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    
    // Server Action
    const res = await createWorkoutPlan(title, description);
    
    if(res.success) {
        playSuccess();
        setIsCreating(false);
        router.push(`/fitness/editor/${res.planId}`);
    }
  };

  const confirmDelete = async () => {
    if (deleteModal.planId) {
        playDelete();
        setPlans(current => current.filter(p => p._id !== deleteModal.planId));
        setDeleteModal({ isOpen: false, planId: "" });
        await deleteWorkoutPlan(deleteModal.planId);
        router.refresh();
    }
  };

  const handleActivate = async (id: string) => {
    playActivate();
    // Optimistic UI update
    setPlans(plans.map(p => ({...p, isActive: p._id === id}))); 
    await activateWorkoutPlan(id);
    router.refresh(); 
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white p-6 md:p-12 font-sans text-left relative overflow-hidden selection:bg-blue-500/30" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* 🌌 Background Ambience */}
        <div className="fixed top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="fixed bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

        {/* 🗑️ DELETE MODAL */}
        <AnimatePresence>
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
                    <motion.div 
                        variants={modalVar} initial="hidden" animate="visible" exit="exit"
                        className="bg-[#0A0A0A] border border-red-500/20 p-8 rounded-[32px] w-full max-w-sm text-center shadow-2xl shadow-red-900/20 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600" />
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <Trash2 size={28} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">{txt.delete_confirm_title || "DELETE PROTOCOL?"}</h3>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">
                            {txt.delete_confirm_msg || "This action is irreversible. Are you sure?"}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteModal({ isOpen: false, planId: "" })} className="flex-1 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors text-xs">{txt.cancel || "CANCEL"}</button>
                            <button onClick={confirmDelete} className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all hover:scale-105 active:scale-95 text-xs">{txt.delete || "DESTROY"}</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* ➕ CREATE MODAL */}
        <AnimatePresence>
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
                    <motion.div 
                        variants={modalVar} initial="hidden" animate="visible" exit="exit"
                        className="bg-[#0F0F0F] border border-white/10 p-1 rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
                        <div className="bg-[#0F0F0F] p-8 rounded-[30px] relative">
                            <button onClick={() => setIsCreating(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
                            <h3 className="font-black text-2xl mb-8 flex items-center gap-3 text-white">
                                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/50"><Plus size={24}/></div>
                                {txt.btn_create || "NEW PROTOCOL"}
                            </h3>
                            <form action={handleCreate} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-blue-400 font-bold tracking-widest uppercase ml-1">{txt.title_label || "PROTOCOL NAME"}</label>
                                    <input name="title" placeholder="e.g. Spartan Hypertrophy" className="w-full bg-black/30 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-gray-700" autoFocus required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 font-bold tracking-widest uppercase ml-1">{txt.desc_label || "OBJECTIVE"}</label>
                                    <input name="description" placeholder="e.g. Strength & Conditioning" className="w-full bg-black/30 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all placeholder:text-gray-700" />
                                </div>
                                <button type="submit" className="w-full py-4 mt-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold text-sm shadow-xl shadow-white/5 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                                    <span>{txt.btn_create || "INITIALIZE"}</span> <ArrowRight size={16}/>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-[1400px] mx-auto relative z-10">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <button onClick={() => { playClick(); router.push('/'); }} className="w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/5 group shadow-lg">
                        <Home size={22} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-3">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{txt.fitness_title || "WORKOUT"}</span> HUB
                        </h1>
                        <p className="text-gray-500 text-sm font-bold tracking-widest flex items-center gap-2 mt-2 uppercase">
                            <LayoutGrid size={12} className="text-blue-500"/> {plans.length} {txt.plans || "Protocols Available"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => { playClick(); loadPlans(); }} className="w-14 h-14 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5 text-gray-400 hover:text-white group" title="Refresh">
                        <RefreshCw size={20} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                    </button>
                    <button onClick={() => { playClick(); setIsCreating(true); }} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 border border-white/10 text-sm">
                        <Plus size={18} /> {txt.btn_create || "CREATE PLAN"}
                    </button>
                    <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="w-14 h-14 flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5 text-gray-400 hover:text-white">
                        <Globe size={20} />
                    </button>
                </div>
            </div>

            {/* PLANS GRID */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-6 border border-white/5 bg-white/[0.02] rounded-[40px]">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <span className="text-xs font-mono tracking-[0.3em] text-blue-500/70">{txt.loading || "INITIALIZING..."}</span>
                    </div>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20"
                    >
                        
                        {/* Always visible "Create New" Card */}
                        <motion.div 
                            variants={cardVariants}
                            whileHover={{ y: -5 }}
                            onClick={() => { playClick(); setIsCreating(true); }}
                            className="border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.01] hover:bg-blue-500/[0.03] rounded-[40px] p-8 flex flex-col justify-center items-center text-center group transition-all duration-300 cursor-pointer min-h-[380px]"
                        >
                            <div className="w-20 h-20 bg-blue-500/5 rounded-full flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform shadow-2xl shadow-blue-900/10 border border-blue-500/10">
                                <Plus size={32} />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{txt.btn_create || "New Protocol"}</h3>
                            <p className="text-gray-600 text-xs max-w-[200px] font-medium leading-relaxed uppercase tracking-widest">{txt.empty_plan || "Design a new training split."}</p>
                        </motion.div>

                        {/* Existing Plans */}
                        {plans.map((plan) => {
                            const totalDays = plan.days ? plan.days.length : 0;
                            const current = plan.currentDayIndex || 0;
                            const progress = totalDays > 0 ? (current / totalDays) * 100 : 0;
                            
                            return (
                                <motion.div 
                                    variants={cardVariants}
                                    whileHover={{ y: -5 }}
                                    onMouseEnter={() => playHover()}
                                    layoutId={plan._id}
                                    key={plan._id} 
                                    onClick={() => { playClick(); router.push(`/fitness/editor/${plan._id}`); }}
                                    className={`group relative p-8 rounded-[40px] border transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[380px] shadow-2xl ${
                                        plan.isActive 
                                        ? 'bg-[#080808] border-green-500/30 shadow-[0_20px_60px_-15px_rgba(34,197,94,0.15)]' 
                                        : 'bg-[#0A0A0A] border-white/5 hover:border-white/10 hover:bg-[#0F0F0F]'
                                    }`}
                                >
                                    {plan.isActive && <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />}
                                    
                                    <div>
                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${plan.isActive ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-white/5 text-gray-400 group-hover:text-white border border-white/5'}`}>
                                                {plan.isActive ? <Activity size={24} /> : <Dumbbell size={24} />}
                                            </div>
                                            {plan.isActive && (
                                                <div className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black tracking-widest flex items-center gap-2 shadow-sm animate-pulse">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
                                                    {txt.active_status || "ACTIVE"}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <h3 className="text-2xl font-black mb-2 text-white truncate pr-4 relative z-10 tracking-tight">{plan.title}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-6 font-medium leading-relaxed relative z-10">{plan.description || "No description provided."}</p>
                                        
                                        <div className="flex items-center gap-3 relative z-10 mb-6">
                                            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 text-[10px] font-bold text-gray-300">
                                                <Calendar size={12} className="text-blue-500"/> {totalDays} {txt.days || "DAYS"}
                                            </div>
                                            {plan.isActive && (
                                                <div className="bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg border border-green-500/10 text-[10px] font-bold flex items-center gap-1.5">
                                                    <CheckCircle size={12}/> {txt.day_done || "DAY"} {current + 1}
                                                </div>
                                            )}
                                        </div>

                                        {totalDays > 0 && (
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    className={`h-full rounded-full ${plan.isActive ? 'bg-green-500' : 'bg-blue-600'}`} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mt-auto pt-6 border-t border-white/5 relative z-10">
                                        {!plan.isActive ? (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleActivate(plan._id); }} 
                                                className="flex-1 py-3 bg-white/5 hover:bg-blue-600 hover:text-white text-gray-400 rounded-xl font-bold flex justify-center items-center gap-2 transition-all group/btn border border-white/5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/30"
                                            >
                                                <PlayCircle size={18} className="group-hover/btn:scale-110 transition-transform" /> 
                                                <span className="text-[10px] tracking-wide">{txt.btn_start || "ACTIVATE"}</span>
                                            </button>
                                        ) : (
                                            <div className="flex-1 flex justify-center items-center text-green-500 font-black text-[10px] tracking-[0.2em] bg-green-500/5 rounded-xl border border-green-500/10 h-[46px]">
                                                {txt.working || "IN PROGRESS"}
                                            </div>
                                        )}

                                        <button 
                                            onClick={() => router.push(`/fitness/editor/${plan._id}`)} 
                                            className="w-12 h-[46px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl font-bold flex justify-center items-center transition-all border border-white/5"
                                        >
                                            <Edit size={18} />
                                        </button>

                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, planId: plan._id }); }} 
                                            className="w-12 h-[46px] bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl font-bold flex justify-center items-center transition-all border border-white/5 hover:border-red-500/20"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </motion.div>
    </div>
  );
}