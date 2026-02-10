"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, Plus, Github, Globe, ExternalLink, 
  Trash2, X, Loader2, Image as ImageIcon, Box, 
  Pause, Play, Activity, AlertTriangle, Target,
  Atom, Server, Database, Code, Cpu, Smartphone, Layers, Terminal,
  Cloud, Lock, Layout, Gamepad2, Anchor, Briefcase
} from "lucide-react";
import { createNewProject, deleteProject, shipProject, setProjectFocus, unsetProjectFocus } from "@/app/actions";
import useSound from "use-sound";
import { useLanguage } from "@/context/LanguageContext";
import AddProjectModal from "./AddProjectModal"; 
import { toast } from "sonner"; // ✅ استيراد التوست

// Helper to map icons for list view
const TECH_ICONS: any = {
    'Next.js': Activity, 'React': Atom, 'Vue': Layout, 'Node.js': Server, 'Python': Terminal,
    'PHP': Code, 'Laravel': Layers, 'Go': Code, 'Rust': Lock, 'SQL': Database,
    'Mongo': Box, 'Firebase': Cloud, 'Flutter': Smartphone, 'Swift': Box,
    'Unity': Gamepad2, 'Docker': Anchor, 'AWS': Cloud, 'AI/ML': Cpu
};

export default function Projects({ projects: initialProjects }: { projects: any[] }) {
  const router = useRouter();
  
  // ✅ استدعاء اللغة
  const { t, lang } = useLanguage();
  const txt = t || {}; // Fallback

  const [mounted, setMounted] = useState(false);
  
  const [projects, setProjects] = useState(initialProjects);
  useEffect(() => { setProjects(initialProjects); }, [initialProjects]);
  useEffect(() => { setMounted(true); }, []);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [shipData, setShipData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  // 🔊 SOUNDS
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.4 });
  const [playHover] = useSound('/sounds/hover.mp3', { volume: 0.05 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
  const [playDelete] = useSound('/sounds/delete.mp3', { volume: 0.5 });
  const [playFocus] = useSound('/sounds/open.mp3', { volume: 0.5, playbackRate: 1.5 }); 
  const [playShipSound] = useSound('/sounds/levelup.mp3', { volume: 0.6 });

  // --- Actions ---
  const handleFocus = async (id: string) => { 
      playFocus(); 
      const newProjects = projects.map(p => ({ ...p, isFocus: p._id === id })); 
      setProjects(newProjects); 
      await setProjectFocus(id); 
      
      // ✅ توست التفعيل (لون نيلي يناسب الثيم)
      toast.success(txt.toast_project_active || "Mission Activated 🎯", {
        position: "bottom-center",
        style: { background: "#1e1b4b", color: "#c7d2fe", border: "1px solid #4338ca" }
      });

      router.refresh(); 
  };
  
  const handleUnfocus = async (id: string) => { 
      playClick(); 
      const newProjects = projects.map(p => ({ ...p, isFocus: false })); 
      setProjects(newProjects); 
      await unsetProjectFocus(id); 
      
      // ✅ توست إلغاء التفعيل (لون رمادي هادئ)
      toast(txt.toast_project_inactive || "Mission Standby ⏸️", {
        position: "bottom-center",
        style: { background: "#101010", color: "#9ca3af", border: "1px solid #333" }
      });

      router.refresh(); 
    };
  
  const handleCreate = async (formData: FormData, tags: string[]) => {
      formData.append("tags", tags.join(','));
      const res = await createNewProject(formData); 
      if (res.success) { 
          playSuccess(); 
          // ✅ إظهار توست عند الإضافة
          toast.success(txt.toast_project_added || "New Mission Initialized 🚀", {
            position: "bottom-center",
            style: { background: "#101010", color: "#fff", border: "1px solid #333" }
          });
          router.refresh(); 
      }
  };

  const confirmDelete = async () => { 
      if (!deleteId) return; playDelete(); 
      const newProjects = projects.filter(p => p._id !== deleteId); 
      setProjects(newProjects); 
      await deleteProject(deleteId); 
      setDeleteId(null); 
      router.refresh(); 
  };

  const handleShip = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); setIsSubmitting(true); 
      const fd = new FormData(e.currentTarget);
      const data = { finalTitle: fd.get("title") as string, finalDescription: fd.get("desc") as string, githubLink: fd.get("github") as string, demoLink: fd.get("demo") as string, image: previewImage };
      await shipProject(shipData._id, data); 
      
      setIsSubmitting(false); setShipData(null); setPreviewImage(""); 
      playShipSound(); 
      
      // ✅ إظهار توست عند الإنهاء (Shipping)
      toast.success(txt.toast_project_shipped || "Mission Deployed Successfully 🌍", {
        position: "bottom-center",
        style: { background: "#052e16", color: "#4ade80", border: "1px solid #166534" }
      });

      router.refresh();
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0]; if (!file) return; 
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (ev: any) => { const img = new Image(); img.src = ev.target.result; img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const MAX = 800; let w = img.width; let h = img.height; if(w>h){if(w>MAX){h*=MAX/w;w=MAX}}else{if(h>MAX){w*=MAX/h;h=MAX}} canvas.width=w; canvas.height=h; ctx?.drawImage(img,0,0,w,h); setPreviewImage(canvas.toDataURL('image/jpeg', 0.8)); }};
  };

  const focusProject = projects.find(p => p.isFocus);
  const otherProjects = projects.filter(p => !p.isFocus);

  // --- Modals Render ---
  const Modals = () => {
      if (!mounted) return null;
      return createPortal(
          <AnimatePresence>
              {shipData && (
                  <motion.div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <motion.div 
                        initial={{scale:0.9, y: 20}} animate={{scale:1, y: 0}} 
                        className="bg-[#0A0A0A] border border-green-500/30 p-8 rounded-[32px] w-full max-w-lg shadow-[0_0_50px_rgba(34,197,94,0.2)] relative overflow-hidden"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                          <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_#22c55e]" />
                          <button onClick={() => { setShipData(null); setPreviewImage(""); }} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"><X size={20}/></button>
                          
                          <div className="text-center mb-8">
                              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20 text-green-500">
                                  <Rocket size={32} />
                              </div>
                              <h3 className="text-2xl font-black text-white">{txt.ship_title || "SHIP PROJECT"}</h3>
                              <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{txt.ship_subtitle || "Prepare for deployment"}</p>
                          </div>

                          <form onSubmit={handleShip} className="space-y-5">
                              <div className="relative w-full aspect-video bg-black/40 rounded-2xl border border-white/10 flex flex-col items-center justify-center group overflow-hidden hover:border-green-500/50 transition-all cursor-pointer">
                                  {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <div className="text-center text-gray-500 group-hover:text-green-500 transition-colors"><ImageIcon size={32} className="mx-auto mb-2" /><span className="text-xs font-bold uppercase tracking-wide">{txt.proj_update_cover || "Update Cover"}</span></div>}
                                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                              </div>
                              
                              <input name="title" defaultValue={shipData.title} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-green-500 transition-colors" placeholder={txt.ship_title_ph} />
                              
                              <textarea name="desc" defaultValue={shipData.description} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white text-sm outline-none focus:border-green-500 h-24 resize-none transition-colors" placeholder={txt.ship_desc_ph} />
                              
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="relative"><Github size={16} className="absolute left-4 top-4 text-gray-500"/><input name="github" className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl text-white text-xs outline-none focus:border-green-500 font-mono" placeholder={txt.ship_repo_ph}/></div>
                                  <div className="relative"><Globe size={16} className="absolute left-4 top-4 text-gray-500"/><input name="demo" className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl text-white text-xs outline-none focus:border-green-500 font-mono" placeholder={txt.ship_demo_ph}/></div>
                              </div>
                              
                              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-black text-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">
                                  {isSubmitting ? <Loader2 className="animate-spin"/> : (txt.ship_confirm_btn || "CONFIRM LAUNCH")}
                              </button>
                          </form>
                      </motion.div>
                  </motion.div>
              )}

              {deleteId && (
                  <motion.div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <motion.div 
                        initial={{scale:0.9}} animate={{scale:1}} 
                        className="bg-[#0A0A0A] border border-red-500/30 p-8 rounded-[32px] w-full max-w-sm text-center shadow-[0_0_50px_rgba(239,68,68,0.15)]"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20"><AlertTriangle className="text-red-500" size={32}/></div>
                          <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">{txt.proj_delete_title || "Terminate Project?"}</h3>
                          <p className="text-gray-500 text-xs mb-8 leading-relaxed">{txt.proj_delete_msg || "This action is irreversible. All data associated with this mission will be lost."}</p>
                          <div className="flex gap-3">
                              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-gray-400 transition-colors text-xs uppercase tracking-wider">{txt.cancel || "Cancel"}</button>
                              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white transition-all shadow-lg shadow-red-900/20 text-xs uppercase tracking-wider">{txt.proj_execute || "Execute"}</button>
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
    <div className="h-full flex flex-col" dir="ltr">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 flex-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div>
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                {txt.proj_title || "PROJECTS"} <span className="text-sm font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">{txt.proj_tag || "DEV"}</span>
            </h2>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1">{txt.proj_subtitle || "Manage your active development missions"}</p>
        </div>
        <button onClick={() => { playClick(); setIsAddOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-indigo-500/20 hover:scale-105">
            <Plus size={16} /> {txt.proj_new_btn || "NEW MISSION"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-8 pb-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <AnimatePresence mode="popLayout">
              {/* 🎯 PRIORITY / FOCUS PROJECT */}
              {focusProject ? (
                  <motion.div layoutId="focus-card" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.95}} className="relative">
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 tracking-[0.3em] uppercase mb-3 animate-pulse px-1">
                          <Target size={12} /> {txt.proj_priority || "Priority Objective"}
                      </div>
                      
                      <div className="bg-gradient-to-br from-[#121212] to-[#0A0A0A] border border-indigo-500/40 p-8 rounded-[32px] relative overflow-hidden group hover:border-indigo-500/60 transition-all shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                          {/* Animated BG */}
                          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none opacity-50" />
                          
                          <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                              <div className="flex-1">
                                  <div className="flex items-start justify-between mb-4">
                                      <h3 className="text-3xl font-black text-white leading-none">{focusProject.title}</h3>
                                      <button onClick={() => handleUnfocus(focusProject._id)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors" title="Remove Priority">
                                          <Pause size={14} fill="currentColor" />
                                      </button>
                                  </div>
                                  
                                  <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-2xl font-medium">{focusProject.description || txt.proj_no_desc}</p>
                                  
                                  <div className="flex flex-wrap gap-2 mb-8">
                                      {focusProject.tags?.map((tag: string) => { 
                                          const Icon = TECH_ICONS[tag] || Box; 
                                          return (
                                              <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                                                  <Icon size={10} /> {tag}
                                              </span>
                                          ); 
                                      })}
                                  </div>

                                  <div className="flex gap-4">
                                      <button onClick={() => { playClick(); setShipData(focusProject); setPreviewImage(""); }} className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-xs flex items-center gap-2 uppercase tracking-wider shadow-lg hover:scale-105 transition-all">
                                          <Rocket size={16} /> {txt.ship_it || "SHIP IT"}
                                      </button>
                                      {focusProject.link && (
                                          <a href={focusProject.link} target="_blank" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-xs flex items-center gap-2 uppercase tracking-wider transition-all">
                                              <ExternalLink size={16}/> {txt.proj_access || "ACCESS"}
                                          </a>
                                      )}
                                  </div>
                              </div>
                              
                              {/* Visual Status Ring */}
                              <div className="hidden md:flex items-center justify-center w-32 h-32 relative">
                                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                                      <circle cx="50" cy="50" r="45" fill="none" stroke="#1e1b4b" strokeWidth="8" />
                                      <motion.circle cx="50" cy="50" r="45" fill="none" stroke="#6366f1" strokeWidth="8" strokeDasharray="283" strokeDashoffset="70" strokeLinecap="round" initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 70 }} transition={{ duration: 1.5, ease: "easeOut" }} />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400">
                                      <Activity size={24} className="animate-pulse" />
                                      <span className="text-[10px] font-black mt-1">{txt.proj_active || "ACTIVE"}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </motion.div>
              ) : (
                  <div className="h-40 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-gray-600 bg-white/[0.01]">
                      <Briefcase size={32} className="mb-3 opacity-30"/>
                      <p className="text-xs font-bold tracking-[0.2em] uppercase">{txt.proj_no_active || "No Active Mission"}</p>
                      <button onClick={() => otherProjects.length > 0 && handleFocus(otherProjects[0]._id)} className="mt-4 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-500/30 underline-offset-4">{txt.proj_select_archive || "Select from archive"}</button>
                  </div>
              )}
          </AnimatePresence>

          {/* 📂 PROJECT ARCHIVE (Grid Layout) */}
          <div>
              <div className="flex items-center justify-between mb-4 px-1">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Layers size={12}/> {txt.proj_archive || "Mission Archive"} ({otherProjects.length})
                  </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherProjects.map(p => (
                      <motion.div 
                        layoutId={p._id} 
                        key={p._id} 
                        onMouseEnter={() => playHover()} 
                        className="group bg-[#121212] border border-white/5 hover:border-white/10 p-5 rounded-2xl relative overflow-hidden transition-all hover:bg-[#181818] cursor-pointer flex flex-col justify-between h-40"
                        onClick={() => handleFocus(p._id)}
                      >
                          <div>
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-200 text-lg group-hover:text-white transition-colors truncate pr-4">{p.title}</h4>
                                  <div className="w-2 h-2 rounded-full bg-gray-700 group-hover:bg-indigo-500 transition-colors" />
                              </div>
                              <p className="text-gray-500 text-xs line-clamp-2 font-medium">{p.description}</p>
                          </div>

                          <div className="flex items-end justify-between mt-4">
                              <div className="flex -space-x-2">
                                  {p.tags?.slice(0,3).map((tag: string, i: number) => { 
                                      const Icon = TECH_ICONS[tag] || Box; 
                                      return (
                                          <div key={i} className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-gray-400 z-10" title={tag}>
                                              <Icon size={12} />
                                          </div>
                                      ); 
                                  })}
                                  {p.tags?.length > 3 && <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-[8px] font-bold text-gray-500">+{p.tags.length - 3}</div>}
                              </div>
                              
                              <button onClick={(e) => { e.stopPropagation(); setDeleteId(p._id); }} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg">
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      </motion.div>
                  ))}
                  
                  {/* Empty Slot */}
                  {otherProjects.length === 0 && focusProject && (
                      <div className="h-40 border border-white/5 rounded-2xl flex items-center justify-center text-gray-700 bg-white/[0.01]">
                          <span className="text-[10px] uppercase tracking-widest">{txt.proj_archive_empty || "Archive Empty"}</span>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
    
    {/* ✅ المودال الجديد المعزول */}
    <AddProjectModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={handleCreate} />
    
    <Modals />
    </>
  );
}