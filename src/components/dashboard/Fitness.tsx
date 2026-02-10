"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dumbbell, AlertTriangle, CheckCircle,
    PlayCircle, Trophy, RotateCcw, LayoutGrid, Loader2, Plus,
    Activity, Timer, Zap, HeartPulse
} from "lucide-react";
import { resetDailyStatus, activateWorkoutPlan } from "@/app/actions";
import useSound from "use-sound";
import { useLanguage } from "@/context/LanguageContext";

interface FitnessProps {
    isWorkoutDone: boolean;
    hasActivePlan: any;
}

export default function Fitness({ isWorkoutDone, hasActivePlan }: FitnessProps) {
    const router = useRouter();
    const { t, lang } = useLanguage();
    const txt = t || {};

    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Sounds
    const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5 });
    const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
    const [playStart] = useSound('/sounds/open.mp3', { volume: 0.6 });

    const uiClick = () => playClick();

    const executeAction = async (fn: Function, ...args: any[]) => {
        uiClick();
        setLoadingId("action");
        await fn(...args);
        playSuccess();
        setLoadingId(null);
    };

    const handleRestartPlan = async () => {
        if (confirm(txt.confirm || "Restart Plan?")) {
            await executeAction(activateWorkoutPlan, hasActivePlan._id);
        }
    };

    // Calculate Progress
    const currentDay = hasActivePlan?.currentDayIndex + 1 || 0;
    const totalDays = hasActivePlan?.totalDays || 1;
    const progressPercent = Math.round((currentDay / totalDays) * 100);

    return (
        <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] rounded-[40px] border border-white/5 p-8 h-[550px] flex flex-col relative overflow-hidden group shadow-2xl">
            {/* Background Atmosphere */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-8 relative z-10 shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                        <span className="p-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20"><Activity size={24} /></span>
                        {txt.fit_title || "BIO-METRICS"}
                    </h2>
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1 ml-1">Physical Protocol</p>
                </div>

                <button
                    onClick={() => router.push('/fitness')}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold rounded-xl transition-colors border border-white/5"
                >
                    <LayoutGrid size={14} /> {lang === 'ar' ? 'الجداول' : 'ALL PLANS'}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative z-10 flex flex-col">
                <AnimatePresence mode="wait">
                    {!hasActivePlan ? (
                        /* EMPTY STATE */
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.01]">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                                <Dumbbell size={32} className="text-blue-500 opacity-80" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{txt.no_plan || "NO PROTOCOL ACTIVE"}</h3>
                            <p className="text-gray-500 text-xs max-w-xs mb-8">Select a training program to begin tracking your physical progress.</p>
                            <button onClick={() => router.push('/fitness')} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-105">
                                <Plus size={18} /> {txt.btn_create || "INITIATE PLAN"}
                            </button>
                        </motion.div>

                    ) : hasActivePlan.totalDays === 0 ? (
                        /* EMPTY PLAN STATE */
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="p-6 bg-yellow-500/10 rounded-full mb-4 animate-pulse"><AlertTriangle size={40} className="text-yellow-500" /></div>
                            <p className="font-bold text-lg text-white">{txt.empty_plan || "Plan is empty"}</p>
                            <button onClick={() => router.push(`/fitness/editor/${hasActivePlan._id}`)} className="mt-6 text-blue-400 text-xs font-bold hover:underline uppercase tracking-widest">Add Workout Days</button>
                        </motion.div>

                    ) : hasActivePlan.isCompleted ? (
                        /* COMPLETED STATE */
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center bg-gradient-to-b from-yellow-500/10 to-transparent rounded-[32px] border border-yellow-500/20">
                            <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
                            <h3 className="text-4xl font-black text-white italic tracking-tighter">{txt.plan_done || "VICTORY"}</h3>
                            <p className="text-yellow-200/60 text-xs font-bold uppercase tracking-[0.2em] mt-2">Protocol Complete</p>
                            <button onClick={handleRestartPlan} className="mt-8 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all">
                                <RotateCcw size={16} /> {txt.btn_reset_plan || "RESTART"}
                            </button>
                        </motion.div>

                    ) : isWorkoutDone ? (
                        /* RECOVERY STATE */
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center bg-[#151515] rounded-[32px] border border-green-500/20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-green-500/5" />
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.4)] relative z-10">
                                <CheckCircle size={48} className="text-black" />
                            </div>
                            <h3 className="text-3xl font-black text-white relative z-10">{txt.day_done || "DAY COMPLETE"}</h3>
                            <p className="text-gray-400 text-xs mt-2 relative z-10 uppercase tracking-widest">Recovery Mode Active</p>

                            <div className="mt-8 relative z-10">
                                <button onClick={async () => { if (confirm("Reset status?")) await executeAction(resetDailyStatus); }} className="text-[10px] text-gray-600 hover:text-red-400 flex items-center gap-1 transition-colors">
                                    <RotateCcw size={10} /> Reset Status (Debug)
                                </button>
                            </div>
                        </motion.div>

                    ) : (
                        /* ACTIVE WORKOUT CARD */
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-2 font-mono">
                                    <span>PROGRESS</span>
                                    <span>{currentDay} / {totalDays} DAYS</span>
                                </div>
                                <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            {/* Hero Card */}
                            <div className="flex-1 bg-[#151515] border border-blue-500/30 rounded-[32px] p-6 relative overflow-hidden group/card shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col justify-between">
                                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

                                {/* Top Info */}
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-lg shadow-lg">
                                            DAY {currentDay}
                                        </div>
                                        <div className="text-[10px] text-yellow-500 font-mono font-bold flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded">
                                            <Zap size={10} fill="currentColor" /> +200 XP
                                        </div>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-black text-white leading-none mb-1">
                                        {hasActivePlan.days[hasActivePlan.currentDayIndex || 0]?.title || 'Unknown Workout'}
                                    </h3>
                                    <p className="text-blue-400/80 text-xs font-bold uppercase tracking-widest">{hasActivePlan.title}</p>
                                </div>

                                {/* Middle Decor */}
                                <div className="relative z-10 flex gap-4 my-4 opacity-50">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-mono">
                                        <Timer size={14} /> 45-60 MIN
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-mono">
                                        <HeartPulse size={14} /> HIGH INTENSITY
                                    </div>
                                </div>

                                {/* Bottom Action */}
                                <button
                                    onClick={() => { playStart(); router.push('/fitness/player'); }}
                                    disabled={loadingId === "workout"}
                                    className="w-full py-4 bg-white text-black font-black rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] flex justify-center items-center gap-2 transition-all hover:scale-[1.02] hover:bg-gray-100 disabled:opacity-50 disabled:scale-100 relative z-20"
                                >
                                    {loadingId === "workout" ? <Loader2 className="animate-spin" /> : <><PlayCircle size={20} fill="black" className="text-white" /> START SESSION</>}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}