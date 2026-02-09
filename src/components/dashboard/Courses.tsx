"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, Plus, ExternalLink, Trash2, X, Loader2, 
  Image as ImageIcon, CheckCircle, Play, Pause, Award, BookOpen, AlertTriangle,
  MonitorPlay, Sparkles
} from "lucide-react";
import { createCourse, deleteCourse, startCourse, finishCourse } from "@/app/actions";
import useSound from "use-sound";
import { useLanguage } from "@/context/LanguageContext";

export default function Courses({ courses: initialCourses }: { courses: any[] }) {
  const router = useRouter();
  
  // ✅ استدعاء اللغة
  const { t, lang } = useLanguage();
  const txt = t || {}; // Fallback

  const [mounted, setMounted] = useState(false);
  
  // Data State
  const [courses, setCourses] = useState(initialCourses);
  useEffect(() => { setCourses(initialCourses); }, [initialCourses]);
  useEffect(() => { setMounted(true); }, []);

  // UI States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [certCourse, setCertCourse] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sounds
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
  const [playLevelUp] = useSound('/sounds/levelup.mp3', { volume: 0.6 });
  const [playDelete] = useSound('/sounds/delete.mp3', { volume: 0.5 });

  // Filter
  const activeCourse = courses.find(c => c.status === 'in_progress');
  const otherCourses = courses.filter(c => c.status === 'idle');

  // --- Handlers ---

  const handleStart = async (id: string) => { 
      playClick(); 
      const updated = courses.map(c => ({ 
          ...c, 
          status: c._id === id ? 'in_progress' : 'idle' 
      })); 
      setCourses(updated); 
      await startCourse(id); 
      router.refresh(); 
  };
  
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); 
      setIsSubmitting(true); 
      
      const fd = new FormData(e.currentTarget); 
      fd.append("image", previewImage);
      
      const res = await createCourse(fd); 
      setIsSubmitting(false); 
      
      if(res.success) { 
          playSuccess(); 
          setIsAddOpen(false); 
          setPreviewImage(""); 
          router.refresh(); 
      }
  };

  const handleDelete = async () => { 
      if(!deleteId) return; 
      playDelete(); 
      const updated = courses.filter(c => c._id !== deleteId); 
      setCourses(updated); 
      await deleteCourse(deleteId); 
      setDeleteId(null);
      router.refresh(); 
  };

  const handleFinish = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); 
      setIsSubmitting(true); 
      const fd = new FormData(e.currentTarget); 
      const certData = { title: fd.get("title"), link: fd.get("link"), image: previewImage };
      
      const res = await finishCourse(certCourse._id, certData); 
      setIsSubmitting(false); 
      
      if(res.success) { 
          playLevelUp(); 
          setCertCourse(null); 
          setPreviewImage(""); 
          const updated = courses.filter(c => c._id !== certCourse._id);
          setCourses(updated);
          router.refresh(); 
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0]; 
      if (!file) return; 
      
      const reader = new FileReader(); 
      reader.readAsDataURL(file); 
      
      reader.onload = (ev) => { 
          const img = new Image(); 
          img.src = ev.target?.result as string; 
          
          img.onload = () => { 
              const canvas = document.createElement('canvas'); 
              const ctx = canvas.getContext('2d'); 
              const MAX = 800; 
              let w = img.width; let h = img.height; 
              
              if(w > h) { if(w > MAX) { h *= MAX/w; w = MAX; } }
              else { if(h > MAX) { w *= MAX/h; h = MAX; } }
              
              canvas.width = w; canvas.height = h; 
              ctx?.drawImage(img, 0, 0, w, h); 
              setPreviewImage(canvas.toDataURL('image/jpeg', 0.8)); 
          }; 
      }; 
  };

  // --- Modals Portal ---
  const Modals = () => {
      if (!mounted) return null;
      return createPortal(
          <AnimatePresence>
              {/* ADD COURSE MODAL */}
              {isAddOpen && (
                  <motion.div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <motion.div 
                        initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}} 
                        className="bg-[#0F0F0F] border border-white/10 p-0 rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                          <div className="h-2 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />
                          
                          <div className="p-6 pb-0">
                              <div className="flex justify-between items-start mb-6">
                                  <div>
                                      <h3 className="text-xl font-black text-white flex items-center gap-2">
                                          <Plus size={20} className="text-cyan-400"/> {txt.new_course || "NEW COURSE"}
                                      </h3>
                                      <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{txt.course_add_path || "Add to Learning Path"}</p>
                                  </div>
                                  <button onClick={() => setIsAddOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"><X size={18}/></button>
                              </div>
                          </div>

                          <form onSubmit={handleCreate} className="p-6 pt-0 space-y-5">
                              <div className="relative w-full h-32 bg-[#1A1A1A] border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-all group shadow-inner">
                                  {previewImage ? <img src={previewImage} className="w-full h-full object-cover rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity" /> : <div className="text-center text-gray-500 group-hover:text-cyan-400 flex flex-col items-center gap-2"><ImageIcon size={24}/><span className="text-[10px] font-bold tracking-widest uppercase">{txt.cover || "UPLOAD COVER"}</span></div>}
                                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                              </div>
                              
                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.lib_title_ph || "Title"}</label>
                                  <input name="title" placeholder={txt.course_title_ph} className="w-full bg-[#1A1A1A] border border-white/5 focus:border-cyan-500 p-4 rounded-xl text-white font-bold outline-none transition-all" required />
                              </div>

                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.lib_link_ph || "Link"}</label>
                                  <input name="link" placeholder="https://" className="w-full bg-[#1A1A1A] border border-white/5 focus:border-cyan-500 p-4 rounded-xl text-white text-xs outline-none font-mono transition-all" />
                              </div>

                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.desc_label || "Description"}</label>
                                  <textarea name="description" placeholder={txt.course_desc_ph} className="w-full bg-[#1A1A1A] border border-white/5 focus:border-cyan-500 p-4 rounded-xl text-white text-sm outline-none h-20 resize-none transition-all" />
                              </div>

                              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.01] shadow-lg shadow-cyan-900/20">
                                  {isSubmitting ? <Loader2 className="animate-spin"/> : txt.course_init_btn || "INITIALIZE MODULE"}
                              </button>
                          </form>
                      </motion.div>
                  </motion.div>
              )}

              {/* CERTIFICATE MODAL */}
              {certCourse && (
                  <motion.div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <motion.div 
                        initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} 
                        className="bg-[#0F0F0F] border border-yellow-500/30 p-0 rounded-[32px] w-full max-w-lg shadow-[0_0_60px_rgba(234,179,8,0.2)] relative overflow-hidden"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                          {/* Gold Header */}
                          <div className="h-32 w-full bg-gradient-to-b from-yellow-500/20 to-transparent flex flex-col items-center justify-center border-b border-yellow-500/10">
                              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-black mb-2 shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-bounce">
                                  <Award size={32} />
                              </div>
                              <h3 className="text-2xl font-black text-white tracking-tight">{txt.claim_cert || "CLAIM CERTIFICATE"}</h3>
                          </div>
                          
                          <button onClick={() => { setCertCourse(null); setPreviewImage(""); }} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20}/></button>

                          <form onSubmit={handleFinish} className="p-8 space-y-6">
                              <div className="relative w-full aspect-video bg-[#1A1A1A] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 transition-colors group">
                                  {previewImage ? <img src={previewImage} className="w-full h-full object-cover rounded-xl" /> : <div className="text-center text-gray-500 group-hover:text-yellow-500"><ImageIcon size={32} className="mx-auto mb-2"/><span className="text-xs font-bold uppercase tracking-widest">{txt.cert_img || "UPLOAD PROOF"}</span></div>}
                                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                              </div>
                              
                              <div className="space-y-4">
                                  <input name="title" placeholder={txt.cert_name || "Certificate Name"} className="w-full bg-[#1A1A1A] border border-white/5 p-4 rounded-xl text-white font-bold outline-none focus:border-yellow-500 transition-colors" required />
                                  <input name="link" placeholder={txt.link_label || "Credential URL"} className="w-full bg-[#1A1A1A] border border-white/5 p-4 rounded-xl text-white text-xs outline-none focus:border-yellow-500 font-mono transition-colors" />
                              </div>

                              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl flex justify-center items-center gap-2 transition-all hover:scale-[1.01] shadow-lg shadow-yellow-500/20 uppercase tracking-widest">
                                  {isSubmitting ? <Loader2 className="animate-spin"/> : txt.complete || "VERIFY COMPLETION"}
                              </button>
                          </form>
                      </motion.div>
                  </motion.div>
              )}

              {/* DELETE CONFIRM */}
              {deleteId && (
                  <motion.div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <motion.div 
                        initial={{scale:0.9}} animate={{scale:1}} 
                        className="bg-[#0A0A0A] border border-red-500/30 p-8 rounded-[32px] w-full max-w-sm text-center shadow-[0_0_40px_rgba(220,38,38,0.2)]"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20"><AlertTriangle className="text-red-500" size={32}/></div>
                          <h3 className="text-xl font-bold text-white mb-2">{txt.delete_confirm_title || "Abort Module?"}</h3>
                          <p className="text-gray-500 text-sm mb-8">{txt.delete_confirm_msg || "This will delete the course progress permanently."}</p>
                          <div className="flex gap-3">
                              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-gray-400 transition-colors text-xs uppercase tracking-wider">{txt.cancel || "CANCEL"}</button>
                              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white transition-all text-xs uppercase tracking-wider shadow-lg shadow-red-900/20">{txt.delete || "DELETE"}</button>
                          </div>
                      </motion.div>
                  </motion.div>
              )}
          </AnimatePresence>,
          document.body
      );
  };

  return (
    <>
    <div 
        className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] rounded-[40px] border border-white/5 p-8 h-[750px] flex flex-col relative overflow-hidden group shadow-2xl"
        dir="ltr" // Force LTR for layout stability
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* 1. Header */}
      <div className="flex justify-between items-center mb-8 relative z-10 shrink-0" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                <span className="p-2 bg-cyan-500/10 rounded-xl text-cyan-500 border border-cyan-500/20"><GraduationCap size={20} /></span> 
                {txt.courses_title || "ACADEMY"}
            </h3>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1 ml-1">{txt.course_skill_acq || "Skill Acquisition"}</p>
        </div>
        <button onClick={() => { playClick(); setIsAddOpen(true); setPreviewImage(""); }} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold transition-colors border border-white/5">
            <Plus size={16} /> {txt.new_course || "ADD MODULE"}
        </button>
      </div>

      {/* 2. Active Course (Hero Card) */}
      <div className="relative z-10 shrink-0 mb-6">
          <AnimatePresence mode="popLayout">
              {activeCourse ? (
                  <motion.div 
                    layoutId="active-course" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.95}} className="relative"
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  >
                      <div className="flex items-center gap-2 text-[10px] font-black text-cyan-400 tracking-[0.2em] uppercase mb-3 animate-pulse px-1">
                          <MonitorPlay size={12}/> {txt.active_course || "IN PROGRESS"}
                      </div>
                      
                      <div className="bg-[#121212] border border-cyan-500/30 p-6 rounded-[32px] relative overflow-hidden group/active shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-50" />
                          
                          <div className="flex gap-6 relative z-10">
                              {/* Cover Image */}
                              <div className="w-24 md:w-32 aspect-square bg-[#0A0A0A] rounded-2xl flex-shrink-0 overflow-hidden border border-white/10 shadow-2xl relative group-hover/active:scale-105 transition-transform duration-500">
                                  {activeCourse.image ? <img src={activeCourse.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><GraduationCap size={32} className="text-cyan-700"/></div>}
                                  {/* Play Overlay */}
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/active:opacity-100 transition-opacity">
                                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"><Play size={16} fill="currentColor"/></div>
                                  </div>
                              </div>
                              
                              {/* Info */}
                              <div className="flex-1 min-w-0 flex flex-col">
                                  <h4 className="font-black text-2xl text-white truncate leading-tight mb-2">{activeCourse.title}</h4>
                                  <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">{activeCourse.description || "No description provided."}</p>
                                  
                                  <div className="flex gap-3 mt-auto">
                                      {activeCourse.link ? (
                                          <a href={activeCourse.link} target="_blank" className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02]">
                                              <Play size={12} fill="currentColor"/> {txt.continue || "CONTINUE"}
                                          </a>
                                      ) : (
                                          <button className="flex-1 py-3 bg-cyan-600/50 cursor-not-allowed text-black/50 font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                                              {txt.course_no_link || "NO LINK"}
                                          </button>
                                      )}
                                      
                                      <button onClick={() => { playClick(); setCertCourse(activeCourse); setPreviewImage(""); }} className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs border border-white/5 transition-colors" title="Finish Course">
                                          <CheckCircle size={16}/>
                                      </button>
                                      
                                      <button onClick={() => handleStart("")} className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/5 transition-colors" title="Pause">
                                          <Pause size={16}/>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </motion.div>
              ) : (
                  <div className="h-40 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-gray-600 bg-white/[0.01]">
                      <div className="p-4 bg-white/5 rounded-full mb-3"><GraduationCap size={24} className="opacity-50"/></div>
                      <p className="text-[10px] font-bold tracking-[0.2em] uppercase">{txt.course_system_idle || "System Idle"}</p>
                      <span className="text-[10px] text-cyan-400 mt-2 cursor-pointer hover:underline" onClick={() => otherCourses.length > 0 && handleStart(otherCourses[0]._id)}>{txt.course_start_module || "Start a module"}</span>
                  </div>
              )}
          </AnimatePresence>
      </div>

      {/* 3. List Queue (Modules) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="space-y-3 pb-2">
              {otherCourses.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2 pl-1">
                      <BookOpen size={12}/> {txt.course_available || "AVAILABLE MODULES"} <span className="bg-white/10 px-2 py-0.5 rounded text-white">{otherCourses.length}</span>
                  </div>
              )}
              
              {otherCourses.map(c => (
                  <motion.div layoutId={c._id} key={c._id} className="group bg-[#121212] border border-white/5 hover:border-cyan-500/30 p-4 rounded-2xl relative overflow-hidden transition-all hover:bg-[#151515] flex items-center gap-4 cursor-pointer" onClick={() => handleStart(c._id)}>
                      {/* Thumbnail */}
                      <div className="w-12 h-12 bg-[#0A0A0A] rounded-xl flex-shrink-0 overflow-hidden border border-white/10 flex items-center justify-center">
                          {c.image ? <img src={c.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"/> : <GraduationCap size={18} className="text-gray-600 group-hover:text-cyan-500"/>}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-300 text-sm truncate group-hover:text-white transition-colors">{c.title}</h4>
                          <p className="text-[10px] text-gray-600 truncate flex items-center gap-1">
                              {c.link ? <><ExternalLink size={8}/> {txt.course_external || "External Module"}</> : (txt.course_self_study || "Self-Paced Study")}
                          </p>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="w-8 h-8 bg-cyan-500/10 text-cyan-500 rounded-lg flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-colors">
                              <Play size={12} fill="currentColor"/>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteId(c._id); }} className="w-8 h-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                              <Trash2 size={12}/>
                          </button>
                      </div>
                  </motion.div>
              ))}
              
              {courses.length === 0 && (
                  <div className="text-center py-10">
                      <p className="text-gray-600 text-xs mb-4">{txt.course_no_modules || "No active learning modules."}</p>
                      <button onClick={() => setIsAddOpen(true)} className="text-cyan-500 text-xs font-bold hover:underline uppercase tracking-widest">{txt.course_init_first || "Initialize First Course"}</button>
                  </div>
              )}
          </div>
      </div>
    </div>
    <Modals />
    </>
  );
}