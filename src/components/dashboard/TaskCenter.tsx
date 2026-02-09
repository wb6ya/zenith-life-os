"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckCircle, Flame, Trophy, Lock, Flag, Plus, X, 
    Loader2, Trash2, CheckSquare, Square, Layers, Sparkles 
} from "lucide-react";
import { completeTask, createMilestone, toggleMilestoneStep, deleteMilestone } from "@/app/actions";
import useSound from "use-sound";
import confetti from "canvas-confetti";
import { useLanguage } from "@/context/LanguageContext"; // ✅ استيراد

export default function TaskCenter({ tasks, milestones = [], userStreak, userLevel }: any) {
  const { t, lang } = useLanguage(); // ✅ استخدام اللغة
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'goals'>('daily');
  const [localTasks, setLocalTasks] = useState(tasks);
  const [localMilestones, setLocalMilestones] = useState(milestones);
  const [localStreak, setLocalStreak] = useState(userStreak);
  
  // UI States
  const [isMilestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Streak Animation States
  const dailyTasks = localTasks.daily || [];
  const allDailyDone = dailyTasks.length > 0 && dailyTasks.every((t: any) => t.isCompleted);
  const [isStreakIgnited, setIsStreakIgnited] = useState(allDailyDone);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);

  // Sounds
  const [playCheck] = useSound('/sounds/click.mp3', { volume: 0.5 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.6 });
  const [playDelete] = useSound('/sounds/delete.mp3', { volume: 0.5 });
  const [playStreak] = useSound('/sounds/levelup.mp3', { volume: 0.8 });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  // Helpers
  const currentList = localTasks[activeTab] || [];
  let progress = 0;
  let completedCount = 0;
  let totalCount = 0;

  if (activeTab === 'goals') {
      totalCount = localMilestones.length;
      completedCount = 0; 
      progress = 100;
  } else {
      completedCount = currentList.filter((t: any) => t.isCompleted).length;
      totalCount = currentList.length;
      progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  }

  const isLocked = (activeTab === 'weekly' || activeTab === 'monthly') && userLevel < 5;

  // Handlers (نفس اللوجيك السابق...)
  const handleCompleteTask = async (taskId: string, xp: number) => {
      playCheck();
      const updatedTasks = { ...localTasks };
      updatedTasks[activeTab] = updatedTasks[activeTab].map((t: any) => 
          t._id === taskId ? { ...t, isCompleted: true } : t
      );
      setLocalTasks(updatedTasks);
      const res = await completeTask(taskId);
      if (res.success) {
          if (res.streakUpdated) {
              setTimeout(() => {
                  playStreak(); setLocalStreak(res.newStreakValue); setIsStreakIgnited(true); setShowStreakAnimation(true);
                  setTimeout(() => setShowStreakAnimation(false), 4500);
              }, 500); 
          } else {
              playSuccess();
              confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#f97316', '#eab308'] });
          }
      }
  };

  const handleAddMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); setIsSubmitting(true);
      const fd = new FormData(e.currentTarget);
      const res = await createMilestone(fd);
      setIsSubmitting(false);
      if (res.success) { playSuccess(); setMilestoneModalOpen(false); window.location.reload(); }
  };

  const handleStepToggle = async (mId: string, stepTitle: string) => {
      playCheck();
      const updated = localMilestones.map((m: any) => {
          if (m._id === mId) {
              const newSteps = m.steps.map((s: any) => s.title === stepTitle ? { ...s, isCompleted: !s.isCompleted } : s);
              return { ...m, steps: newSteps };
          }
          return m;
      });
      setLocalMilestones(updated);
      const res = await toggleMilestoneStep(mId, stepTitle);
      if (res?.isCompleted) { playSuccess(); confetti(); }
  };

  const handleDeleteMilestone = async (id: string) => {
      playDelete();
      setLocalMilestones(localMilestones.filter((m:any) => m._id !== id));
      await deleteMilestone(id);
  };

  // --- Components ---
  const StreakOverlay = () => { /* ... (نفس الكود السابق) ... */ return null; }; // اختصاراً للكود هنا، استخدم نفس الـ component السابق

  const MilestoneModal = () => {
      if (!mounted) return null;
      return createPortal(
          <AnimatePresence>
              {isMilestoneModalOpen && (
                  <motion.div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <motion.div initial={{scale:0.9, y: 20}} animate={{scale:1, y: 0}} exit={{scale:0.9, y: 20}} className="bg-[#151515] border border-white/10 p-8 rounded-[32px] w-full max-w-md shadow-2xl relative">
                          <button onClick={() => setMilestoneModalOpen(false)} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white"><X size={18}/></button>
                          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2"><Flag size={20} className="text-yellow-500"/> {t.tasks_new_goal}</h3>
                          <form onSubmit={handleAddMilestone} className="space-y-5">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t.tasks_goal_label}</label>
                                  <input name="title" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-yellow-500 transition-colors" required />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t.tasks_steps_label}</label>
                                  <textarea name="steps" className="w-full bg-black/30 border border-white/10 p-4 rounded-xl text-white text-sm outline-none focus:border-yellow-500 h-32 resize-none transition-colors leading-relaxed" required />
                              </div>
                              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg shadow-yellow-900/20 hover:scale-[1.02]">
                                  {isSubmitting ? <Loader2 className="animate-spin"/> : t.tasks_create_btn}
                              </button>
                          </form>
                      </motion.div>
                  </motion.div>
              )}
          </AnimatePresence>, document.body
      );
  };

  return (
    <div className="w-full max-w-4xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <StreakOverlay />
        <MilestoneModal />
        
        {/* Tabs & Streak Indicator */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex bg-[#121212] p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto">
                {(['daily', 'weekly', 'monthly', 'goals'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {tab === 'goals' ? <span className="flex items-center gap-1"><Flag size={10}/> {t.tasks_goals}</span> : t[`tasks_${tab}`]}
                    </button>
                ))}
            </div>

            {activeTab === 'goals' ? (
                <button onClick={() => setMilestoneModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-bold transition-all hover:scale-105 active:scale-95"><Plus size={12}/> NEW</button>
            ) : (
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {activeTab === 'daily' && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-500 ${isStreakIgnited ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-white/5 border-white/5 text-gray-500 grayscale'}`}>
                            <Flame size={14} fill={isStreakIgnited ? "currentColor" : "none"} className={isStreakIgnited ? "animate-pulse" : ""} /> 
                            <span className="text-xs font-black tracking-widest">{localStreak} {t.tasks_streak}</span>
                        </div>
                    )}
                    
                    {!isLocked && <div className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">{completedCount}/{totalCount}</div>}
                </div>
            )}
        </div>

        {/* Content List */}
        <div className="space-y-3 min-h-[300px]">
            <AnimatePresence mode="popLayout">
                {isLocked ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl gap-3 text-gray-600">
                        <Lock size={32} />
                        <p className="text-xs font-bold uppercase tracking-widest">{t.tasks_locked}</p>
                        <p className="text-[10px]">{t.tasks_unlock_lvl.replace('{level}', '5')} (Current: {userLevel})</p>
                    </motion.div>
                ) : activeTab === 'goals' ? (
                    // --- MILESTONES VIEW ---
                    localMilestones.length > 0 ? (
                        localMilestones.map((m: any) => {
                            const doneSteps = m.steps.filter((s:any) => s.isCompleted).length;
                            const totalSteps = m.steps.length;
                            const percentage = totalSteps === 0 ? 0 : (doneSteps / totalSteps) * 100;
                            
                            return (
                                <motion.div layout key={m._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group bg-[#151515] border border-white/5 p-5 rounded-2xl relative overflow-hidden hover:border-yellow-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                                                <Flag size={16} className="text-yellow-500" /> {m.title}
                                            </h4>
                                            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono uppercase pl-6">
                                                <span className="flex items-center gap-1"><Layers size={10}/> {totalSteps} {t.tasks_steps}</span>
                                                <span className="flex items-center gap-1 text-yellow-500/70"><Trophy size={10}/> 1000 {t.tasks_reward}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteMilestone(m._id)} className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"><Trash2 size={16}/></button>
                                    </div>
                                    <div className="w-full h-1.5 bg-black rounded-full mb-4 overflow-hidden relative">
                                        <motion.div className="h-full bg-yellow-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${percentage}%` }} />
                                    </div>
                                    <div className="space-y-2 pl-2">
                                        {m.steps.map((step: any, idx: number) => (
                                            <button key={idx} onClick={() => handleStepToggle(m._id, step.title)} className="flex items-center gap-3 w-full text-left group/step hover:bg-white/[0.02] p-1 rounded-lg transition-colors">
                                                {step.isCompleted ? <CheckSquare size={16} className="text-yellow-500 flex-shrink-0"/> : <Square size={16} className="text-gray-600 group-hover/step:text-gray-400 flex-shrink-0"/>}
                                                <span className={`text-xs ${step.isCompleted ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{step.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )
                        })
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                            <Flag size={32} className="mx-auto mb-3 text-gray-700"/>
                            <p className="text-gray-500 text-sm mb-4">{t.tasks_no_goals}</p>
                            <button onClick={() => setMilestoneModalOpen(true)} className="text-xs text-blue-400 font-bold hover:underline uppercase tracking-widest">{t.tasks_create_btn}</button>
                        </div>
                    )
                ) : (
                    // --- TASKS VIEW ---
                    currentList.length > 0 ? (
                        currentList.map((task: any) => (
                            <motion.div
                                layout
                                key={task._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group p-4 rounded-2xl border transition-all flex items-center justify-between ${task.isCompleted ? 'bg-[#0A0A0A] border-green-500/20 opacity-60' : 'bg-[#151515] border-white/5 hover:border-white/10 hover:bg-[#1a1a1a]'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => !task.isCompleted && handleCompleteTask(task._id, task.xpReward)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.isCompleted ? 'bg-green-500 border-green-500 text-black' : 'border-gray-600 hover:border-white text-transparent'}`}
                                    >
                                        <CheckCircle size={14} fill={task.isCompleted ? "currentColor" : "none"} className={task.isCompleted ? "opacity-100" : "opacity-0"} />
                                    </button>
                                    <div>
                                        <h4 className={`font-bold text-sm transition-all ${task.isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getCategoryColor(task.category)}`}>{task.category}</span>
                                            <span className="text-[9px] text-yellow-500 font-mono flex items-center gap-1"><Trophy size={8}/> +{task.xpReward} XP</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl text-gray-500">
                            <CheckCircle size={24} className="mx-auto mb-2 opacity-50"/>
                            <p className="text-sm font-bold">{t.tasks_all_done}</p>
                            <p className="text-xs">{t.tasks_regen}</p>
                        </div>
                    )
                )}
            </AnimatePresence>
        </div>
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