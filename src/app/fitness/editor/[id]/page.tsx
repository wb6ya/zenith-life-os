"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, Save, Dumbbell, Coffee, 
  CheckCircle, Upload, Youtube, ChevronDown, 
  ChevronRight, Calendar, ArrowLeft, AlertCircle, 
  Globe, Info, Repeat, Hash, Clock, Loader2, GripVertical, Activity, Layers
} from "lucide-react";
import { saveDayToPlan, activateWorkoutPlan, getWorkoutPlan, fillRestDays } from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import useSound from "use-sound";

// --- Custom Modal (Glass Style) ---
const CustomModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'info', t }: any) => {
  if (!isOpen) return null;
  const txt = t || {}; 
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#0A0A0A] border border-white/10 p-8 rounded-[32px] w-full max-w-sm shadow-2xl text-center relative overflow-hidden"
      >
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${type === 'danger' ? 'from-red-500 to-orange-500' : 'from-cyan-500 to-blue-500'}`} />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
            {type === 'danger' ? <AlertCircle size={32} /> : <Info size={32} />}
        </div>
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">{title}</h3>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed font-medium">{message}</p>
        <div className="flex gap-3 justify-center">
          {onCancel && <button onClick={onCancel} className="flex-1 px-6 py-3 bg-white/5 rounded-xl text-gray-300 font-bold hover:bg-white/10 transition-colors text-xs tracking-wider">{txt.cancel || "CANCEL"}</button>}
          <button onClick={onConfirm} className={`flex-1 px-6 py-3 rounded-xl font-bold text-black shadow-lg transition-all active:scale-95 text-xs tracking-wider ${type === 'danger' ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-cyan-500 hover:bg-cyan-400'}`}>{txt.confirm || "CONFIRM"}</button>
        </div>
      </motion.div>
    </div>
  );
};

export default function PlanEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();

  // Sounds
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5 });
  const [playSave] = useSound('/sounds/save.mp3', { volume: 0.5 });
  const [playDelete] = useSound('/sounds/delete.mp3', { volume: 0.5 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.6 });

  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<any>({ isOpen: false });
  const [months, setMonths] = useState([{ id: 1, daysCount: 30, isOpen: true }]);
  const [currentGlobalDay, setCurrentGlobalDay] = useState(1); 
  const [savedDaysMap, setSavedDaysMap] = useState<Record<number, any>>({});
  
  const [dayData, setDayData] = useState<any>({
    dayNumber: 1, title: "", isRestDay: false, exercises: []
  });

  const txt = t || {};

  useEffect(() => {
    async function init() {
        const res = await getWorkoutPlan(id);
        if (res.success && res.plan) {
            const map: any = {};
            res.plan.days.forEach((d: any) => { map[d.dayNumber] = { ...d, isSaved: true }; });
            setSavedDaysMap(map);
            if (map[1]) setDayData(map[1]);
            
            const maxDay = Math.max(...res.plan.days.map((d: any) => d.dayNumber), 30);
            const loadedMonthsCount = Math.ceil(maxDay / 30);
            const newMonths = Array.from({ length: loadedMonthsCount || 1 }, (_, i) => ({ id: i + 1, daysCount: 30, isOpen: i === 0 }));
            setMonths(newMonths);
        }
    }
    init();
  }, [id]);

  const switchDay = (globalDayNum: number) => {
    playClick();
    if (savedDaysMap[globalDayNum]) { setDayData({ ...savedDaysMap[globalDayNum] }); } 
    else { setDayData({ dayNumber: globalDayNum, title: "", isRestDay: false, exercises: [] }); }
    setCurrentGlobalDay(globalDayNum);
  };

  const addMonth = () => {
      playClick();
      setMonths([...months, { id: months.length + 1, daysCount: 30, isOpen: false }]);
  };

  const deleteMonth = (monthIndex: number) => {
    playClick();
    if (months.length <= 1) { 
        setModal({ isOpen: true, title: "Error", message: txt.fit_ed_err_month || "Cannot delete the only remaining month.", type: 'warning', onConfirm: () => setModal({ isOpen: false }) }); 
        return; 
    }
    setModal({
        isOpen: true, title: txt.fit_ed_del_cycle_title || "Delete Cycle?", message: txt.fit_ed_del_cycle_msg || "This will wipe all data for this month. Proceed?", type: 'danger',
        onCancel: () => setModal({ isOpen: false }),
        onConfirm: () => {
            playDelete();
            const monthToDelete = months[monthIndex];
            const startDay = months.slice(0, monthIndex).reduce((acc, m) => acc + m.daysCount, 0) + 1;
            const endDay = startDay + monthToDelete.daysCount - 1;
            const shiftAmount = monthToDelete.daysCount;
            const newMap: any = {};
            Object.keys(savedDaysMap).forEach(keyStr => {
                const dayNum = parseInt(keyStr);
                if (dayNum < startDay) newMap[dayNum] = savedDaysMap[dayNum];
                else if (dayNum > endDay) { const newDayNum = dayNum - shiftAmount; newMap[newDayNum] = { ...savedDaysMap[dayNum], dayNumber: newDayNum }; }
            });
            const newMonths = months.filter((_, i) => i !== monthIndex).map((m, i) => ({ ...m, id: i + 1 }));
            setSavedDaysMap(newMap); setMonths(newMonths); setCurrentGlobalDay(1);
            if (newMap[1]) setDayData(newMap[1]); else setDayData({ dayNumber: 1, title: "", isRestDay: false, exercises: [] });
            setModal({ isOpen: false });
        }
    });
  };

  const toggleMonth = (monthId: number) => setMonths(months.map(m => m.id === monthId ? { ...m, isOpen: !m.isOpen } : m));

  const handleSaveDay = async () => {
    if (!dayData.title && !dayData.isRestDay) { 
        setModal({ isOpen: true, title: txt.fit_ed_miss_info || "Missing Info", message: txt.fit_ed_miss_desc || "Please enter a title or mark as Rest Day.", onConfirm: () => setModal({ isOpen: false }) }); 
        return; 
    }
    setLoading(true);
    const res = await saveDayToPlan(id, dayData);
    setLoading(false);
    if (res.success) {
        playSave();
        setSavedDaysMap(prev => ({ ...prev, [dayData.dayNumber]: { ...dayData, isSaved: true } }));
        setModal({ isOpen: true, title: txt.fit_ed_saved || "Saved", type: 'success', message: txt.fit_ed_saved_msg || "Day protocol updated successfully.", onConfirm: () => setModal({ isOpen: false }) });
    } else { 
        setModal({ isOpen: true, title: "Error", type: 'danger', message: txt.fit_ed_save_err || "Failed to save.", onConfirm: () => setModal({ isOpen: false }) }); 
    }
  };

  const handleActivate = async () => {
    const savedIndices = Object.keys(savedDaysMap).map(Number).sort((a, b) => a - b);
    if (savedIndices.length === 0) return; 
    const lastDay = savedIndices[savedIndices.length - 1];
    const missingDays: number[] = [];
    for (let i = 1; i < lastDay; i++) { if (!savedDaysMap[i]) missingDays.push(i); }

    if (missingDays.length > 0) {
        setModal({
            isOpen: true, type: 'warning', title: txt.fit_ed_miss_days || "Missing Days", message: txt.fit_ed_fill_rest || `You have ${missingDays.length} empty days. Fill them as 'Rest Days'?`,
            onCancel: () => setModal({ isOpen: false }), 
            onConfirm: async () => {
                setLoading(true); await fillRestDays(id, missingDays); await activateWorkoutPlan(id); playSuccess(); setLoading(false); router.push("/");
            }
        });
    } else {
        setModal({
            isOpen: true, title: txt.fit_ed_act_confirm_title || "Activate Protocol", type: 'info', message: txt.fit_ed_act_confirm_msg || "This will be your active daily driver. Ready?",
            onCancel: () => setModal({ isOpen: false }),
            onConfirm: async () => { await activateWorkoutPlan(id); playSuccess(); router.push("/"); }
        });
    }
  };

  const addExercise = () => {
      playClick();
      setDayData({ ...dayData, exercises: [...dayData.exercises, { name: "", mediaUrl: "", mediaType: "video", sets: 3, reps: 12, restBetweenSets: 60 }] });
  };
  
  const updateExercise = (index: number, field: string, value: any) => { const newEx = [...dayData.exercises]; newEx[index] = { ...newEx[index], [field]: value }; setDayData({ ...dayData, exercises: newEx }); };
  
  const handleFileUpload = (e: any, index: number) => { 
      const file = e.target.files[0]; 
      if (!file) return; 
      if (file.size > 5 * 1024 * 1024) { 
          setModal({ isOpen: true, title: txt.fit_ed_file_large || "File too large", message: "Max 5MB", onConfirm: () => setModal({ isOpen: false }) }); 
          return; 
      } 
      const reader = new FileReader(); 
      reader.onloadend = () => updateExercise(index, 'mediaUrl', reader.result); 
      reader.readAsDataURL(file); 
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans flex flex-col md:flex-row overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <CustomModal {...modal} t={txt} />
      
      {/* 🌌 Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
      <div className={`absolute top-0 w-[500px] h-[500px] bg-blue-900/10 blur-[150px] pointer-events-none ${lang === 'ar' ? 'left-0' : 'right-0'}`} />

      {/* 🗓️ SIDEBAR (The Timeline) */}
      <div className={`w-full md:w-80 bg-[#050505]/80 backdrop-blur-xl h-screen overflow-y-auto custom-scrollbar flex flex-col z-20 relative shadow-2xl ${lang === 'ar' ? 'border-l border-white/5' : 'border-r border-white/5'}`}>
         <div className="p-6 border-b border-white/5 sticky top-0 bg-[#050505]/95 z-10">
             <div className="flex justify-between items-center mb-6">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-black tracking-widest">
                    <ArrowLeft size={14} className={lang === 'ar' ? 'rotate-180' : ''}/> {txt.fit_ed_exit || "EXIT"}
                </button>
                <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-gray-400 hover:text-white font-mono border border-white/5"><Globe size={12} /></button>
             </div>
             <h2 className="font-black text-2xl text-white flex items-center gap-3 tracking-tighter">
                 <Calendar size={20} className="text-cyan-500"/> {txt.fit_ed_timeline || "TIMELINE"}
             </h2>
         </div>
         
         <div className="flex-1 p-4 space-y-4 pb-24">
             {months.map((month, mIndex) => {
                 const startDay = months.slice(0, mIndex).reduce((acc, m) => acc + m.daysCount, 0) + 1;
                 return (
                    <div key={month.id} className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden group">
                        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => toggleMonth(month.id)}>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-cyan-500 uppercase tracking-widest">{txt.fit_ed_month || "MONTH"} {month.id}</span>
                                {months.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); deleteMonth(mIndex); }} className="p-1 text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                                )}
                            </div>
                            {month.isOpen ? <ChevronDown size={14} className="text-gray-500"/> : <ChevronRight size={14} className={`text-gray-500 ${lang === 'ar' ? 'rotate-180' : ''}`}/>}
                        </div>
                        
                        <AnimatePresence>
                            {month.isOpen && (
                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                    <div className="grid grid-cols-5 gap-1 p-2 bg-black/20 border-t border-white/5">
                                            {Array.from({ length: month.daysCount }).map((_, i) => {
                                                const globalDay = startDay + i;
                                                const savedInfo = savedDaysMap[globalDay];
                                                const isActive = currentGlobalDay === globalDay;
                                                const isSaved = !!savedInfo?.isSaved;
                                                const isRest = savedInfo?.isRestDay;
                                                
                                                return (
                                                    <button 
                                                        key={globalDay} 
                                                        onClick={() => switchDay(globalDay)} 
                                                        className={`aspect-square rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all relative border ${isActive ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-900/50 z-10' : isRest ? 'bg-green-900/10 text-green-500 border-green-500/20' : isSaved ? 'bg-white/5 text-white border-white/10' : 'bg-transparent text-gray-700 border-white/5 hover:bg-white/5'}`}
                                                    >
                                                        {i + 1}
                                                        {isSaved && !isActive && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isRest ? 'bg-green-500' : 'bg-white'}`}></div>}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                 )
             })}
             <button onClick={addMonth} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-600 hover:text-white hover:border-white/20 text-[10px] font-bold tracking-widest flex justify-center items-center gap-2 transition-all hover:bg-white/5"><Plus size={12} /> {txt.fit_ed_add_cycle || "ADD CYCLE"}</button>
         </div>
      </div>

      {/* 📝 MAIN EDITOR (The Schematic) */}
      <div className="flex-1 bg-[#020202] p-6 md:p-10 overflow-y-auto h-screen custom-scrollbar relative">
          
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-10 sticky top-0 bg-[#020202]/90 backdrop-blur-md z-20 py-4 border-b border-white/5 -mx-6 px-6 md:-mx-10 md:px-10 shadow-lg">
              <div>
                  <h1 className="text-3xl font-black text-white flex items-center gap-2 tracking-tighter">
                      {txt.fit_ed_day || "DAY"} <span className="text-cyan-500">{currentGlobalDay}</span> {txt.fit_ed_day_config || "CONFIG"}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                      <Activity size={10} className={savedDaysMap[currentGlobalDay]?.isSaved ? "text-cyan-500" : "text-gray-600"} />
                      <p className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">
                          {txt.fit_ed_status || "STATUS"}: {savedDaysMap[currentGlobalDay]?.isSaved ? (savedDaysMap[currentGlobalDay].isRestDay ? <span className="text-green-500">{txt.fit_ed_stat_recovery || "RECOVERY PROTOCOL"}</span> : <span className="text-cyan-500">{txt.fit_ed_stat_active || "ACTIVE PROTOCOL"}</span>) : <span className="text-gray-700">{txt.fit_ed_stat_uninit || "UNINITIALIZED"}</span>}
                      </p>
                  </div>
              </div>
              <button onClick={handleActivate} className="px-6 py-3 bg-white text-black rounded-xl font-black flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] text-xs tracking-widest hover:scale-105 transition-transform"><CheckCircle size={14} /> {txt.fit_ed_activate || "ACTIVATE"}</button>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
              
              {/* Settings Panel */}
              <div className="bg-[#080808] p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
                  <div className={`absolute top-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none ${lang === 'ar' ? 'left-0' : 'right-0'}`} />
                  
                  <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-3">
                          <label className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase ml-1">{txt.fit_ed_proto_title || "PROTOCOL TITLE"}</label>
                          <input value={dayData.title} onChange={(e) => setDayData({...dayData, title: e.target.value})} placeholder={txt.fit_ed_proto_ph || "e.g. Legs & Core Destruction"} className="w-full bg-[#121212] border border-white/10 p-5 rounded-2xl text-xl text-white outline-none focus:border-cyan-500 transition-colors font-bold placeholder:text-gray-800" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase ml-1">{txt.fit_ed_mode || "MODE"}</label>
                        <button onClick={() => setDayData({...dayData, isRestDay: !dayData.isRestDay, exercises: []})} className={`h-[68px] px-8 rounded-2xl font-bold flex items-center justify-center gap-3 border transition-all w-full md:w-auto ${dayData.isRestDay ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-[#121212] border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}>
                            {dayData.isRestDay ? <Coffee size={20} /> : <Dumbbell size={20} />} 
                            {dayData.isRestDay ? (txt.fit_ed_mode_recovery || "RECOVERY") : (txt.fit_ed_mode_training || "TRAINING")}
                        </button>
                      </div>
                  </div>
              </div>
              
              {/* Exercises Area */}
              <AnimatePresence mode="wait">
                  {dayData.isRestDay ? (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-32 text-center border-2 border-dashed border-white/5 rounded-[32px] bg-[#050505]">
                          <div className="w-24 h-24 bg-green-500/5 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 border border-green-500/10"><Coffee size={48} /></div>
                          <h3 className="text-3xl font-black text-white mb-2 tracking-tight">{txt.fit_ed_active_rec || "ACTIVE RECOVERY"}</h3>
                          <p className="text-gray-500 text-sm max-w-xs mx-auto font-mono">{txt.fit_ed_rec_desc || "No heavy lifting required. Focus on sleep and nutrition."}</p>
                      </motion.div>
                  ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                          {dayData.exercises.map((ex: any, idx: number) => (
                              <motion.div layout key={idx} className="bg-[#080808] p-6 rounded-[24px] border border-white/5 relative group hover:border-cyan-500/30 transition-all shadow-xl">
                                  <div className="flex justify-between items-start mb-6">
                                      <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 bg-cyan-900/20 text-cyan-400 rounded-xl flex items-center justify-center font-black text-sm border border-cyan-500/20">{(idx + 1).toString().padStart(2, '0')}</div>
                                          <div className="h-10 w-[1px] bg-white/10" />
                                          <GripVertical size={20} className="text-gray-700 cursor-grab active:cursor-grabbing hover:text-gray-500" />
                                      </div>
                                      <button onClick={() => { const n = [...dayData.exercises]; n.splice(idx, 1); setDayData({...dayData, exercises: n}); }} className="p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                  </div>

                                  <div className={`space-y-6 ${lang === 'ar' ? 'pr-14' : 'pl-14'}`}>
                                      <input placeholder={txt.fit_ed_ex_name || "EXERCISE NAME"} value={ex.name} onChange={(e) => updateExercise(idx, 'name', e.target.value)} className={`w-full bg-transparent text-2xl font-black text-white outline-none border-b-2 py-2 transition-colors uppercase tracking-tight ${!ex.name ? 'border-red-500/30 placeholder:text-red-900' : 'border-white/5 focus:border-cyan-500'}`} />
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div>
                                              <label className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-2 block">{txt.fit_ed_media || "MEDIA"}</label>
                                              <div className="bg-[#121212] p-1 rounded-xl flex mb-3 border border-white/5">
                                                  <button onClick={() => updateExercise(idx, 'mediaType', 'video')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold flex justify-center items-center gap-2 transition-all ${ex.mediaType === 'video' ? 'bg-white/10 text-white shadow-md' : 'text-gray-600 hover:text-gray-300'}`}><Youtube size={12}/> {txt.fit_ed_link || "LINK"}</button>
                                                  <button onClick={() => updateExercise(idx, 'mediaType', 'image')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold flex justify-center items-center gap-2 transition-all ${ex.mediaType === 'image' ? 'bg-white/10 text-white shadow-md' : 'text-gray-600 hover:text-gray-300'}`}><Upload size={12}/> {txt.fit_ed_upload || "UPLOAD"}</button>
                                              </div>
                                              {ex.mediaType === 'video' ? ( <input placeholder="YouTube URL..." value={ex.mediaUrl} onChange={(e) => updateExercise(idx, 'mediaUrl', e.target.value)} className="w-full bg-[#121212] rounded-xl px-4 py-3 text-xs outline-none border border-white/5 focus:border-cyan-500 font-mono text-gray-300" dir="ltr"/> ) : ( <div className="relative group/upload cursor-pointer h-[42px]"><input type="file" onChange={(e) => handleFileUpload(e, idx)} className="absolute inset-0 opacity-0 z-10 cursor-pointer" /><div className={`w-full h-full bg-[#121212] rounded-xl border border-dashed border-white/10 flex items-center justify-center text-[10px] gap-2 transition-colors ${ex.mediaUrl ? 'text-green-500 border-green-500/30' : 'text-gray-600 group-hover/upload:border-cyan-500/50 group-hover/upload:text-cyan-400'}`}>{ex.mediaUrl ? <><CheckCircle size={12}/> {txt.fit_ed_uploaded || "UPLOADED"}</> : <><Upload size={12}/> {txt.fit_ed_click_upload || "CLICK TO UPLOAD"}</>}</div></div> )}
                                          </div>

                                          <div>
                                              <label className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase mb-2 block">{txt.fit_ed_metrics || "METRICS"}</label>
                                              <div className="grid grid-cols-3 gap-2">
                                                  <div className="bg-[#121212] p-3 rounded-xl border border-white/5 text-center"><div className="flex justify-center mb-1 text-cyan-500"><Repeat size={14}/></div><input type="number" value={ex.sets} onChange={(e) => updateExercise(idx, 'sets', Number(e.target.value))} className="w-full bg-transparent text-center font-bold outline-none text-white"/><span className="text-[8px] text-gray-600 font-bold uppercase">{txt.fit_ed_sets || "Sets"}</span></div>
                                                  <div className="bg-[#121212] p-3 rounded-xl border border-white/5 text-center"><div className="flex justify-center mb-1 text-purple-500"><Hash size={14}/></div><input type="number" value={ex.reps} onChange={(e) => updateExercise(idx, 'reps', Number(e.target.value))} className="w-full bg-transparent text-center font-bold outline-none text-white"/><span className="text-[8px] text-gray-600 font-bold uppercase">{txt.fit_ed_reps || "Reps"}</span></div>
                                                  <div className="bg-[#121212] p-3 rounded-xl border border-white/5 text-center"><div className="flex justify-center mb-1 text-orange-500"><Clock size={14}/></div><input type="number" value={ex.restBetweenSets} onChange={(e) => updateExercise(idx, 'restBetweenSets', Number(e.target.value))} className="w-full bg-transparent text-center font-bold outline-none text-white"/><span className="text-[8px] text-gray-600 font-bold uppercase">{txt.fit_ed_rest || "Rest (s)"}</span></div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </motion.div>
                          ))}
                          <button onClick={addExercise} className="w-full py-6 border-2 border-dashed border-white/10 rounded-[24px] text-gray-600 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-3 group"><div className="p-2 bg-white/5 rounded-full group-hover:bg-cyan-500 group-hover:text-black transition-colors"><Plus size={20} /></div><span className="font-bold text-xs tracking-[0.2em] uppercase">{txt.fit_ed_add_module || "ADD MODULE"}</span></button>
                      </motion.div>
                  )}
              </AnimatePresence>

              {/* Sticky Save */}
              <div className="sticky bottom-6 pt-4 z-30">
                  <button onClick={handleSaveDay} disabled={loading} className="w-full py-5 bg-white hover:bg-gray-200 text-black font-black rounded-2xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:scale-100 uppercase tracking-widest text-sm">
                      {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> {txt.fit_ed_save_proto || "SAVE PROTOCOL"}: {txt.fit_ed_day || "DAY"} {currentGlobalDay}</>}
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
}