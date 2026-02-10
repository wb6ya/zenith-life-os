"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Trash2, Edit, Play, Loader2,
    Activity, X, ArrowRight, Home, Calendar, CheckCircle2, Zap, RefreshCw,
    Dumbbell,
    Layers
} from "lucide-react";
import { createWorkoutPlan, getUserPlans, deleteWorkoutPlan, activateWorkoutPlan } from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import useSound from "use-sound";

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const cardVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
        y: 0, opacity: 1, scale: 1,
        transition: { type: "spring", stiffness: 120, damping: 15 }
    }
};

const modalVar = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", bounce: 0.3 } },
    exit: { opacity: 0, scale: 0.95, y: 10 }
};

export default function FitnessHub() {
    const router = useRouter();
    const { t, lang } = useLanguage();
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

        const res = await createWorkoutPlan(title, description);

        if (res.success) {
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
        setPlans(plans.map(p => ({ ...p, isActive: p._id === id })));
        await activateWorkoutPlan(id);
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-[#020202] text-white p-6 md:p-12 font-sans relative overflow-x-hidden selection:bg-cyan-500/30" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* 🌌 Atmospheric Background */}
            <div className="fixed top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.04] pointer-events-none" />
            <div className="fixed top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none" />

            {/* 🗑️ DELETE MODAL */}
            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <motion.div
                            variants={modalVar} initial="hidden" animate="visible" exit="exit"
                            className="bg-[#0F0F0F] border border-white/10 p-1 rounded-2xl w-full max-w-sm shadow-2xl relative"
                        >
                            <div className="bg-[#0A0A0A] p-6 rounded-2xl text-center overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600" />
                                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border border-red-500/20">
                                    <Trash2 size={22} />
                                </div>
                                <h3 className="text-lg font-black text-white mb-2 uppercase tracking-wide">{txt.fit_del_title || "TERMINATE PROTOCOL?"}</h3>
                                <p className="text-gray-500 text-xs mb-6 leading-relaxed font-mono">
                                    {txt.fit_del_msg || "This action is irreversible. All data associated with this plan will be lost."}
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={() => setDeleteModal({ isOpen: false, planId: "" })} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors text-xs tracking-wider">{txt.fit_cancel || "CANCEL"}</button>
                                    <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 transition-all hover:scale-105 active:scale-95 text-xs tracking-wider">{txt.fit_confirm || "CONFIRM"}</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ➕ CREATE MODAL */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <motion.div
                            variants={modalVar} initial="hidden" animate="visible" exit="exit"
                            className="bg-[#0F0F0F] border border-white/10 p-1 rounded-2xl w-full max-w-md shadow-2xl relative"
                        >
                            <div className="bg-[#0A0A0A] p-6 rounded-2xl relative overflow-hidden">
                                <button onClick={() => setIsCreating(false)} className={`absolute top-4 p-1.5 bg-white/5 hover:bg-white/20 rounded-full transition-colors text-gray-400 hover:text-white ${lang === 'ar' ? 'left-4' : 'right-4'}`}><X size={16} /></button>

                                <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-white">
                                    <span className="text-blue-500"><Plus size={22} /></span>
                                    {txt.fit_create_title || "NEW PROTOCOL"}
                                </h3>

                                <form action={handleCreate} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase ml-1">{txt.fit_input_name || "PROTOCOL NAME"}</label>
                                        <input name="title" placeholder={lang === 'ar' ? "مثال: تضخيم سبارتي" : "e.g. Spartan Hypertrophy"} className="w-full bg-[#151515] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-gray-700 text-sm" autoFocus required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase ml-1">{txt.fit_input_obj || "OBJECTIVE"}</label>
                                        <input name="description" placeholder={lang === 'ar' ? "مثال: قوة ولياقة بدنية" : "e.g. Strength & Conditioning"} className="w-full bg-[#151515] border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition-all placeholder:text-gray-700 text-sm" />
                                    </div>
                                    <button type="submit" className="w-full py-3 mt-2 bg-white text-black hover:bg-gray-200 rounded-xl font-black text-xs tracking-widest shadow-xl shadow-white/5 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                                        {txt.fit_btn_submit || "INITIALIZE SYSTEM"} <ArrowRight size={16} className={lang === 'ar' ? "rotate-180" : ""} />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-[1400px] mx-auto relative z-10">

                {/* ✅ NEW HEADER DESIGN (Translated) */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 p-4 bg-[#0A0A0A]/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
                    {/* Background Accent */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 pointer-events-none" />

                    {/* Title Section */}
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 transform -rotate-6">
                            <Dumbbell size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none mb-1">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-white">{txt.fit_title || "FITNESS"}</span>
                                <span className="text-white/90 ml-2">{txt.fit_hub || "HUB"}</span>
                            </h1>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium tracking-wider uppercase">
                                <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                    <Layers size={12} className="text-blue-400" /> {plans.length} {txt.fit_protocols || "Protocols"}
                                </span>
                                <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                    <Zap size={12} className="text-yellow-400" /> {plans.filter(p => p.isActive).length} {txt.fit_active_count || "Active"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center gap-2 relative z-10 w-full lg:w-auto justify-end">
                        <button onClick={() => { playClick(); router.push('/'); }} className="w-10 h-10 flex items-center justify-center bg-[#151515] hover:bg-[#222] rounded-xl text-gray-400 hover:text-white transition-all border border-white/5 group shadow-md">
                            <Home size={18} className="group-hover:text-blue-400 transition-colors" />
                        </button>
                        <button onClick={() => { playClick(); loadPlans(); }} className="w-10 h-10 flex items-center justify-center bg-[#151515] hover:bg-[#222] rounded-xl transition-colors border border-white/5 text-gray-400 hover:text-white group">
                            <RefreshCw size={18} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                        </button>
                        <button onClick={() => { playClick(); setIsCreating(true); }} className="flex-1 lg:flex-none h-10 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 hover:scale-105 active:scale-95 border border-white/10 text-[10px] tracking-widest">
                            <Plus size={14} /> {txt.fit_btn_create || "CREATE PLAN"}
                        </button>
                    </div>
                </div>

                {/* PLANS GRID */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-6 border border-white/5 bg-white/[0.01] rounded-[40px] animate-pulse">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                            <span className="text-xs font-mono tracking-[0.3em] text-blue-500/70">{txt.fit_loading || "INITIALIZING..."}</span>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20"
                        >

                            {/* "Create New" Card */}
                            <motion.div
                                variants={cardVariants}
                                whileHover={{ y: -5, scale: 1.02 }}
                                onClick={() => { playClick(); setIsCreating(true); }}
                                className="relative min-h-[360px] rounded-[32px] border-2 border-dashed border-white/10 bg-white/[0.01] hover:bg-blue-500/[0.02] hover:border-blue-500/30 flex flex-col justify-center items-center text-center cursor-pointer group transition-all duration-300"
                            >
                                <div className="w-20 h-20 bg-[#0F0F0F] rounded-full flex items-center justify-center mb-6 text-gray-600 group-hover:text-blue-400 group-hover:scale-110 transition-all border border-white/5 group-hover:border-blue-500/20 shadow-2xl">
                                    <Plus size={32} />
                                </div>
                                <h3 className="text-lg font-black text-white mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-widest">{txt.fit_new_proto_title || "NEW PROTOCOL"}</h3>
                                <p className="text-gray-600 text-xs font-mono max-w-[200px]">{txt.fit_new_proto_desc || "Initialize a new training sequence."}</p>
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
                                        className={`group relative p-8 rounded-[32px] border transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[360px] shadow-2xl ${plan.isActive
                                                ? 'bg-[#080808] border-green-500/40 shadow-[0_0_40px_-10px_rgba(34,197,94,0.1)]'
                                                : 'bg-[#0A0A0A] border-white/5 hover:border-white/10 hover:bg-[#0E0E0E]'
                                            }`}
                                    >
                                        {/* Active Glow Effect */}
                                        {plan.isActive && (
                                            <>
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />
                                                <div className={`absolute top-4 px-3 py-1 bg-green-500 text-black text-[9px] font-black rounded-full tracking-widest z-20 flex items-center gap-1 ${lang === 'ar' ? 'left-4' : 'right-4'}`}>
                                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" /> {txt.fit_active_count || "ACTIVE"}
                                                </div>
                                            </>
                                        )}

                                        {/* Card Content */}
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${plan.isActive
                                                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                        : 'bg-white/5 text-gray-400 group-hover:text-white border border-white/5'
                                                    }`}>
                                                    {plan.isActive ? <Activity size={26} /> : <Dumbbell size={26} />}
                                                </div>
                                                <div>
                                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">{txt.fit_label_protocol || "Protocol"}</div>
                                                    <h3 className={`text-xl font-black leading-none line-clamp-1 ${plan.isActive ? 'text-white' : 'text-gray-200'}`}>{plan.title}</h3>
                                                </div>
                                            </div>

                                            <p className="text-xs text-gray-500 line-clamp-2 h-9 mb-8 font-medium leading-relaxed font-mono pl-1 border-l-2 border-white/5">
                                                {plan.description || (txt.fit_no_desc || "No description.")}
                                            </p>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-2 gap-3 mb-6">
                                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                    <div className="text-[9px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Calendar size={10} /> {txt.fit_label_duration || "Duration"}</div>
                                                    <div className="text-lg font-black text-white">{totalDays} <span className="text-[10px] text-gray-600 font-medium">{txt.fit_label_days || "Days"}</span></div>
                                                </div>
                                                <div className={`rounded-xl p-3 border ${plan.isActive ? 'bg-green-500/5 border-green-500/10' : 'bg-white/5 border-white/5'}`}>
                                                    <div className={`text-[9px] font-bold uppercase mb-1 flex items-center gap-1 ${plan.isActive ? 'text-green-500' : 'text-gray-500'}`}>
                                                        <CheckCircle2 size={10} /> {txt.fit_label_progress || "Progress"}
                                                    </div>
                                                    <div className={`text-lg font-black ${plan.isActive ? 'text-green-400' : 'text-white'}`}>
                                                        {Math.round(progress)}<span className="text-[10px] font-medium">%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            {totalDays > 0 && (
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        className={`h-full rounded-full ${plan.isActive ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-blue-600'}`}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 mt-auto pt-6 border-t border-white/5 relative z-10">
                                            {!plan.isActive ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleActivate(plan._id); }}
                                                    className="flex-1 h-10 bg-white text-black hover:bg-blue-500 hover:text-white rounded-lg font-bold flex justify-center items-center gap-2 transition-all text-[10px] tracking-widest uppercase shadow-lg"
                                                >
                                                    <Play size={12} fill="currentColor" /> {txt.fit_btn_activate || "ACTIVATE"}
                                                </button>
                                            ) : (
                                                <div className="flex-1 flex justify-center items-center text-green-500 font-black text-[10px] tracking-[0.2em] bg-green-500/5 rounded-lg border border-green-500/10 h-10 uppercase">
                                                    {txt.fit_status_working || "IN PROGRESS"}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => router.push(`/fitness/editor/${plan._id}`)}
                                                className="w-10 h-10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg flex justify-center items-center transition-colors border border-white/5"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, planId: plan._id }); }}
                                                className="w-10 h-10 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg flex justify-center items-center transition-colors border border-white/5 hover:border-red-500/20"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
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