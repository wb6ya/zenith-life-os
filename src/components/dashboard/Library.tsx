"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, CheckCircle, RotateCcw, X, Image as ImageIcon, 
  Plus, ExternalLink, Loader2, AlertTriangle, Trash2, Pencil, Sparkles, Book,
  Bookmark
} from "lucide-react";
import { addBook, updateResource, startReadingBook, finishBook, resetBookStatus, updateProgress, deleteBook } from "@/app/actions";
import useSound from "use-sound";
import { useLanguage } from "@/context/LanguageContext";

export default function Library({ resources }: { resources: any[] }) {
  const { t, lang } = useLanguage(); 
  const txt = t || {}; // Fallback
  const [mounted, setMounted] = useState(false);
  
  // Data Filtering
  const activeBooks = resources.filter(r => r.status !== 'completed');
  const currentBook = activeBooks.find(r => r.status === 'reading');
  const otherBooks = activeBooks.filter(r => r.status !== 'reading');

  // UI States
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageBase64, setImageBase64] = useState("");

  // Sounds
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
  const [playDelete] = useSound('/sounds/delete.mp3', { volume: 0.5 });
  const [playHover] = useSound('/sounds/hover.mp3', { volume: 0.05 });

  useEffect(() => { setMounted(true); }, []);

  // Handlers
  const openAddModal = () => { 
      playClick(); setEditingBook(null); setImageBase64(""); setIsModalOpen(true); 
  };
  
  const openEditModal = () => { 
      playClick(); 
      if (!selectedBook) return; 
      setEditingBook(selectedBook); 
      setImageBase64(selectedBook.image || ""); 
      setIsModalOpen(true); 
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (ev: any) => {
      const img = new Image(); img.src = ev.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        const MAX = 600; let w = img.width; let h = img.height;
        if(w>h){if(w>MAX){h*=MAX/w;w=MAX}}else{if(h>MAX){w*=MAX/h;h=MAX}}
        canvas.width=w; canvas.height=h; ctx?.drawImage(img,0,0,w,h);
        setImageBase64(canvas.toDataURL('image/jpeg', 0.8));
      }
    };
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault(); setIsSubmitting(true);
      const formData = new FormData(e.currentTarget); formData.append("image", imageBase64); 
      
      let res;
      if (editingBook) { formData.append("id", editingBook._id); res = await updateResource(formData); } 
      else { res = await addBook(formData); }
      
      setIsSubmitting(false);
      if (res?.success) { 
          playSuccess(); setIsModalOpen(false); setSelectedBook(null); 
          setEditingBook(null); setImageBase64(""); 
      }
  };

  const handleDelete = async () => {
      if (!selectedBook) return; playDelete(); 
      const id = selectedBook._id;
      setIsDeleteConfirmOpen(false); setSelectedBook(null); 
      await deleteBook(id); 
  };

  // --- Modals Portal ---
  const Modals = () => {
      if (!mounted) return null;
      return createPortal(
          <AnimatePresence>
              {/* ADD / EDIT MODAL */}
              {isModalOpen && (
                  <motion.div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <motion.div 
                        initial={{y:20, opacity:0, scale: 0.95}} animate={{y:0, opacity:1, scale: 1}} exit={{y:20, opacity:0, scale: 0.95}} 
                        className="bg-[#0F0F0F] border border-white/10 p-0 rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        // Force LTR layout for the modal structure, but text can be Arabic
                        dir="ltr"
                      >
                          <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
                          
                          <div className="p-6 pb-0">
                              <div className="flex justify-between items-start mb-6">
                                  {/* Align text based on language */}
                                  <div className={`flex-1 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                                      <h3 className={`text-xl font-black text-white flex items-center gap-2 ${lang === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
                                          {editingBook ? <Pencil size={20} className="text-blue-400"/> : <Plus size={20} className="text-purple-400"/>} 
                                          {editingBook ? (txt.lib_edit_entry || "EDIT ENTRY") : (txt.lib_new_entry || "NEW ENTRY")}
                                      </h3>
                                      <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">{txt.lib_update_msg || "Update Knowledge Base"}</p>
                                  </div>
                                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"><X size={18}/></button>
                              </div>
                          </div>

                          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                              {/* Cover Upload */}
                              <div className="relative group cursor-pointer w-full aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 bg-[#151515] hover:border-purple-500/50 transition-all shadow-inner">
                                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                                  {imageBase64 ? (
                                      <img src={imageBase64} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500 group-hover:text-purple-400">
                                          <ImageIcon size={24} />
                                          <span className="text-[10px] font-bold tracking-widest uppercase">{txt.lib_upload_cover || "UPLOAD COVER"}</span>
                                      </div>
                                  )}
                              </div>

                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.lib_title_ph || "Title"}</label>
                                  <input name="title" defaultValue={editingBook?.title} placeholder={txt.lib_title_ph} className="w-full bg-[#1A1A1A] border border-white/5 focus:border-purple-500 p-4 rounded-xl text-white font-bold text-sm outline-none transition-all placeholder:text-gray-700" required />
                              </div>

                              <div className="flex gap-4">
                                  <div className="space-y-2 flex-1">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.lib_pages_ph || "Pages"}</label>
                                      <input name="totalUnits" type="number" defaultValue={editingBook?.totalUnits} placeholder="0" className="w-full bg-[#1A1A1A] border border-white/5 focus:border-purple-500 p-4 rounded-xl text-white text-sm outline-none transition-all placeholder:text-gray-700" required />
                                  </div>
                                  <div className="space-y-2 flex-1">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.lib_link_ph || "Link"}</label>
                                      <input name="link" defaultValue={editingBook?.link} placeholder="https://" className="w-full bg-[#1A1A1A] border border-white/5 focus:border-purple-500 p-4 rounded-xl text-white text-sm outline-none transition-all placeholder:text-gray-700" />
                                  </div>
                              </div>

                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{txt.lib_notes_ph || "Notes"}</label>
                                  <textarea name="description" defaultValue={editingBook?.description} placeholder="..." className="w-full bg-[#1A1A1A] border border-white/5 focus:border-purple-500 p-4 rounded-xl text-white text-sm outline-none h-24 resize-none transition-all placeholder:text-gray-700" />
                              </div>

                              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg shadow-purple-900/20 hover:scale-[1.01]">
                                  {isSubmitting ? <Loader2 className="animate-spin" /> : (txt.lib_save_btn || "SAVE ENTRY")}
                              </button>
                          </form>
                      </motion.div>
                  </motion.div>
              )}

              {/* BOOK DETAILS MODAL */}
              {selectedBook && (
                  <motion.div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedBook(null)}>
                      <motion.div 
                        initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} 
                        onClick={e => e.stopPropagation()} 
                        className="bg-[#0F0F0F] border border-white/10 rounded-[40px] p-8 w-full max-w-3xl flex flex-col md:flex-row gap-8 shadow-[0_0_60px_rgba(168,85,247,0.15)] relative overflow-hidden"
                        dir="ltr" // Force layout LTR
                      >
                          <div className="absolute top-[-50%] right-[-50%] w-[150%] h-[150%] bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none blur-3xl" />
                          <button onClick={() => setSelectedBook(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/20 text-white z-20 transition-colors"><X size={18}/></button>
                          
                          {/* Book Cover */}
                          <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
                              <div className="aspect-[2/3] w-full bg-[#151515] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                                  {selectedBook.image ? <img src={selectedBook.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={48} className="text-white/10"/></div>}
                                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={openEditModal} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2 text-xs font-bold"><Pencil size={14}/> {txt.lib_edit_entry || "EDIT"}</button>
                                  <button onClick={() => setIsDeleteConfirmOpen(true)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all"><Trash2 size={16}/></button>
                              </div>
                          </div>
                          
                          {/* Info Side (Apply RTL for text here) */}
                          <div className="flex-1 flex flex-col relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                              <h2 className="text-4xl font-black text-white mb-2 leading-none tracking-tight">{selectedBook.title}</h2>
                              <div className="flex flex-wrap gap-2 mb-6">
                                  <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-md font-mono flex items-center gap-1"><Book size={12}/> {selectedBook.totalUnits} {txt.pages_label || "PAGES"}</span>
                                  {selectedBook.link && <a href={selectedBook.link} target="_blank" className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-md flex items-center gap-1 hover:bg-blue-500 hover:text-white transition-all font-mono"><ExternalLink size={12}/> LINK</a>}
                              </div>
                              
                              <div className="bg-[#151515] p-5 rounded-2xl border border-white/5 mb-8 flex-1 overflow-y-auto max-h-40 custom-scrollbar">
                                  <p className="text-gray-400 text-sm leading-relaxed">{selectedBook.description || txt.lib_no_notes || "No notes."}</p>
                              </div>
                              
                              <div className="mt-auto">
                                  <button onClick={() => { startReadingBook(selectedBook._id); setSelectedBook(null); }} className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.01]">
                                      <BookOpen size={18}/> {txt.lib_start_read || "START READING"}
                                  </button>
                              </div>
                          </div>
                      </motion.div>
                  </motion.div>
              )}

              {/* DELETE CONFIRM */}
              {isDeleteConfirmOpen && (
                  <motion.div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                      <motion.div 
                        initial={{scale:0.9}} animate={{scale:1}} 
                        className="bg-[#0A0A0A] border border-red-500/30 p-8 rounded-[32px] w-full max-w-sm text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      >
                          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20"><AlertTriangle className="text-red-500" size={28}/></div>
                          <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">{txt.lib_delete_title || "Delete Entry?"}</h3>
                          <p className="text-gray-500 text-xs mb-8">{txt.lib_delete_msg || "This will permanently remove this item."}</p>
                          <div className="flex gap-3">
                              <button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-gray-400 transition-colors text-xs">{txt.cancel || "CANCEL"}</button>
                              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold transition-all shadow-lg shadow-red-900/20 text-xs">{txt.delete || "DELETE"}</button>
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
        // Force LTR for layout, but we will handle text direction internally
        dir="ltr"
    >
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                <span className="p-2 bg-purple-500/10 rounded-xl text-purple-500 border border-purple-500/20"><Book size={20} /></span> 
                {txt.library_title || "ARCHIVE"}
            </h3>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1 ml-1">{txt.lib_subtitle || "Knowledge Database"}</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold transition-colors border border-white/5">
            <Plus size={16} /> {txt.add || "ADD ENTRY"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 relative z-10 space-y-8">
          
          {/* Active Book Card (Hero Section) */}
          <AnimatePresence mode="popLayout">
            {currentBook ? (
                <motion.div 
                    layoutId={currentBook._id} 
                    initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} 
                    className="w-full bg-[#121212] border border-purple-500/30 rounded-[32px] p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group/active shadow-[0_0_30px_rgba(168,85,247,0.1)]"
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-50" />
                    
                    {/* Cover */}
                    <div className="w-24 md:w-32 aspect-[2/3] flex-shrink-0 rounded-2xl shadow-2xl overflow-hidden border border-white/10 bg-[#0A0A0A] relative z-10 rotate-1 group-hover/active:rotate-0 transition-transform duration-500">
                        {currentBook.image ? <img src={currentBook.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={32} className="text-white/20"/></div>}
                    </div>
                    
                    {/* Info & Controls */}
                    <div className="flex-1 flex flex-col relative z-10 min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 tracking-[0.2em] uppercase mb-2 animate-pulse">
                                    <Sparkles size={12}/> {txt.reading_now || "ACTIVE READ"}
                                </div>
                                <h2 className="text-2xl font-black text-white leading-tight mb-2 truncate pr-2">{currentBook.title}</h2>
                            </div>
                            <div className="text-right hidden md:block">
                                <span className="text-3xl font-black text-white block">{Math.round((currentBook.completedUnits/currentBook.totalUnits)*100)}%</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{txt.lib_complete_label || "Complete"}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-[10px] text-gray-400 font-mono font-bold">
                                <span>{txt.lib_page_caps || "PAGE"} {currentBook.completedUnits}</span>
                                <span>{txt.lib_goal_caps || "GOAL"} {currentBook.totalUnits}</span>
                            </div>
                            <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                                    initial={{width:0}} 
                                    animate={{width:`${(currentBook.completedUnits/currentBook.totalUnits)*100}%`}} 
                                    transition={{duration: 1}} 
                                />
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-auto">
                            <button onClick={() => updateProgress(currentBook._id, 1)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-[10px] transition-colors border border-white/5 flex items-center justify-center gap-1 group/btn"><Plus size={12} className="text-gray-500 group-hover/btn:text-white transition-colors"/> 1 {txt.lib_pg_short || "PG"}</button>
                            <button onClick={() => updateProgress(currentBook._id, 5)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-[10px] transition-colors border border-white/5 flex items-center justify-center gap-1 group/btn"><Plus size={12} className="text-gray-500 group-hover/btn:text-white transition-colors"/> 5 {txt.lib_pg_short || "PG"}</button>
                            <button onClick={() => { playSuccess(); finishBook(currentBook._id); }} className="flex-1 py-3 bg-green-500/10 hover:bg-green-500 hover:text-black text-green-500 border border-green-500/20 font-bold rounded-xl text-[10px] transition-all flex items-center justify-center gap-2"><CheckCircle size={14}/> {txt.finish || "DONE"}</button>
                            <button onClick={() => resetBookStatus(currentBook._id)} className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/5 transition-colors"><RotateCcw size={16}/></button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="h-48 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-gray-600 bg-white/[0.01]">
                    <div className="p-4 bg-white/5 rounded-full mb-3"><BookOpen size={24} className="opacity-50"/></div>
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase">{txt.no_active_book || "NO ACTIVE READING"}</p>
                    <span className="text-[10px] text-purple-400 mt-2 cursor-pointer hover:underline" onClick={() => otherBooks.length > 0 && setSelectedBook(otherBooks[0])}>{txt.lib_select_shelf || "Select from shelf"}</span>
                </div>
            )}
          </AnimatePresence>

          {/* Shelf (Scrollable List) */}
          <div className="pt-2">
              {otherBooks.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-4 pl-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                      <Bookmark size={12}/> {txt.shelf || "BOOKSHELF"} <span className="bg-white/10 px-2 py-0.5 rounded text-white">{otherBooks.length}</span>
                  </div>
              )}
              
              <div className="flex overflow-x-auto gap-4 pb-6 custom-scrollbar snap-x">
                  {otherBooks.map((book) => (
                      <motion.div 
                        layoutId={book._id} 
                        key={book._id} 
                        onClick={() => { playClick(); setSelectedBook(book); }} 
                        onMouseEnter={() => playHover()}
                        className="relative min-w-[140px] w-[140px] h-[220px] bg-[#121212] rounded-2xl border border-white/5 cursor-pointer overflow-hidden group shadow-lg flex-shrink-0 snap-start hover:translate-y-[-5px] transition-all duration-300"
                      >
                          {/* Spine/Cover */}
                          {book.image ? (
                              <div className="w-full h-full relative">
                                  <img src={book.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                              </div>
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A]">
                                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-3 text-purple-500"><Book size={18}/></div>
                                  <span className="text-[10px] font-bold text-gray-400 line-clamp-3 leading-relaxed uppercase tracking-wider">{book.title}</span>
                              </div>
                          )}
                          
                          {/* Info Overlay */}
                          <div className="absolute bottom-0 left-0 w-full p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                              <h4 className="text-xs font-bold text-white line-clamp-1 mb-1 shadow-black drop-shadow-md">{book.title}</h4>
                              <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                                  <span className="text-[9px] text-gray-400 font-mono">{book.totalUnits}{txt.lib_pg_short || "P"}</span>
                                  <div className="w-6 h-6 bg-white text-black rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform"><Plus size={12}/></div>
                              </div>
                          </div>
                      </motion.div>
                  ))}
                  
                  {/* Quick Add Placeholder */}
                  <button onClick={openAddModal} className="min-w-[140px] w-[140px] h-[220px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-600 hover:text-purple-400 hover:border-purple-500/30 transition-all gap-3 flex-shrink-0 bg-white/[0.02] hover:bg-white/[0.05] group">
                      <div className="p-3 bg-white/5 rounded-full group-hover:scale-110 transition-transform"><Plus size={20}/></div>
                      <span className="text-[9px] font-bold tracking-[0.2em]">{txt.lib_add_new || "ADD NEW"}</span>
                  </button>
              </div>
          </div>

      </div>
    </div>
    <Modals />
    </>
  );
}