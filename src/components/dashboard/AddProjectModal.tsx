"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2, Search, Activity, Atom, Layout, Box, Server, Terminal, Code, Layers, Lock, Database, Cloud, Smartphone, Gamepad2, Anchor, Cpu, ArrowRight, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// Tech Stacks Data
const TECH_STACKS = [
    { id: 'Next.js', icon: Activity, color: 'text-white' },
    { id: 'React', icon: Atom, color: 'text-blue-400' },
    { id: 'Vue', icon: Layout, color: 'text-green-400' },
    { id: 'Node.js', icon: Server, color: 'text-green-500' },
    { id: 'Python', icon: Terminal, color: 'text-yellow-300' },
    { id: 'PHP', icon: Code, color: 'text-purple-400' },
    { id: 'Laravel', icon: Layers, color: 'text-red-600' },
    { id: 'Go', icon: Code, color: 'text-cyan-300' },
    { id: 'Rust', icon: Lock, color: 'text-orange-400' },
    { id: 'SQL', icon: Database, color: 'text-blue-300' },
    { id: 'Mongo', icon: Box, color: 'text-green-600' },
    { id: 'Firebase', icon: Cloud, color: 'text-yellow-500' },
    { id: 'Flutter', icon: Smartphone, color: 'text-blue-400' },
    { id: 'Swift', icon: Box, color: 'text-orange-500' },
    { id: 'Unity', icon: Gamepad2, color: 'text-gray-300' },
    { id: 'Docker', icon: Anchor, color: 'text-blue-500' },
    { id: 'AWS', icon: Cloud, color: 'text-yellow-600' },
    { id: 'AI/ML', icon: Cpu, color: 'text-purple-500' },
];

interface AddProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (formData: FormData, tags: string[]) => Promise<void>;
}

export default function AddProjectModal({ isOpen, onClose, onAdd }: AddProjectModalProps) {
    const { t, lang } = useLanguage();
    const txt = t || {};
    
    const [selectedStack, setSelectedStack] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState(""); 

    const filteredTechs = TECH_STACKS.filter(t => t.id.toLowerCase().includes(searchTerm.toLowerCase()));

    const toggleTech = (id: string) => {
        setSelectedStack(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (ev: any) => {
            const img = new Image();
            img.src = ev.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const MAX = 800; let w = img.width; let h = img.height;
                if(w>h){if(w>MAX){h*=MAX/w;w=MAX}}else{if(h>MAX){w*=MAX/h;h=MAX}}
                canvas.width=w; canvas.height=h; ctx?.drawImage(img,0,0,w,h);
                setPreviewImage(canvas.toDataURL('image/jpeg', 0.8));
            }
        };
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const fd = new FormData(e.currentTarget);
        
        if (previewImage) {
            fd.append("image", previewImage);
        }

        try {
            await onAdd(fd, selectedStack);
            setSelectedStack([]);
            setSearchTerm("");
            setPreviewImage("");
            onClose();
        } catch (error) {
            console.error("Failed to add project:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <motion.div 
                        initial={{scale:0.95, opacity:0, y: 20}} 
                        animate={{scale:1, opacity:1, y: 0}} 
                        exit={{scale:0.95, opacity:0, y: 20}} 
                        className="bg-[#0F0F0F] border border-white/10 p-0 rounded-[32px] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    >
                        <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600" />
                        
                        <div className="p-8 pb-0">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                                        {txt.proj_add_title || "INITIALIZE PROTOCOL"}
                                    </h3>
                                    <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{txt.proj_add_subtitle || "Define new mission parameters"}</p>
                                </div>
                                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
                                    <X size={20}/>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 space-y-6">
                            
                            {/* Image Upload */}
                            <div className="relative w-full aspect-[21/9] bg-[#1A1A1A] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors group overflow-hidden">
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                                {previewImage ? (
                                    <img src={previewImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-indigo-400">
                                        <ImageIcon size={32} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{txt.lib_upload_cover || "UPLOAD COVER"}</span>
                                    </div>
                                )}
                            </div>

                            {/* Project Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.proj_codename || "Mission Codename"}</label>
                                <input name="title" placeholder="e.g. Zenith OS v2" className="w-full bg-[#1A1A1A] border border-white/5 focus:border-indigo-500 p-4 rounded-xl text-white font-bold outline-none transition-all placeholder:text-gray-700" required />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.proj_briefing || "Objective Briefing"}</label>
                                <textarea name="description" placeholder={txt.proj_briefing_ph || "Describe the mission goals..."} className="w-full bg-[#1A1A1A] border border-white/5 focus:border-indigo-500 p-4 rounded-xl text-white text-sm outline-none h-24 resize-none transition-all placeholder:text-gray-700 leading-relaxed" />
                            </div>

                            {/* Tech Stack Selector */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{txt.proj_tech || "Required Tech"}</label>
                                    <span className="text-[10px] font-mono text-indigo-400">{selectedStack.length} {txt.proj_tech_selected || "SELECTED"}</span>
                                </div>
                                
                                <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-4">
                                    <div className="relative mb-3">
                                        <Search size={14} className={`absolute top-3 text-gray-500 ${lang === 'ar' ? 'right-3' : 'left-3'}`}/>
                                        <input 
                                            value={searchTerm} 
                                            onChange={(e) => setSearchTerm(e.target.value)} 
                                            placeholder={txt.proj_tech_ph || "Filter technology..."} 
                                            className={`w-full bg-black/30 border border-white/5 p-2 rounded-lg text-xs text-white outline-none focus:border-indigo-500/50 transition-colors placeholder:text-gray-600 ${lang === 'ar' ? 'pr-9' : 'pl-9'}`}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                        {filteredTechs.map((tech) => (
                                            <button key={tech.id} type="button" onClick={() => toggleTech(tech.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedStack.includes(tech.id) ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'}`}>
                                                <tech.icon size={12} /> {tech.id}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Link */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.lib_link_ph || "Repository / Link"}</label>
                                <input name="link" placeholder="https://..." className="w-full bg-[#1A1A1A] border border-white/5 focus:border-indigo-500 p-4 rounded-xl text-white text-xs outline-none font-mono transition-all placeholder:text-gray-700" />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl flex justify-center items-center gap-2 mt-4 shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)]">
                                {isSubmitting ? <Loader2 className="animate-spin"/> : (
                                    <>{txt.proj_start_btn || "START MISSION"} <ArrowRight size={16} strokeWidth={3} className={lang === 'ar' ? 'rotate-180' : ''}/></>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}