"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gamepad2, Clapperboard, Book, Search, Plus, 
  Trash2, X, Loader2, Star, CheckCircle, Play, Pause, MonitorPlay, 
  AlertTriangle, Image as ImageIcon, ShieldCheck
} from "lucide-react";
import { 
    searchEntertainment, 
    getEntertainmentDetails, 
    addEntertainment, 
    deleteEntertainment, 
    setActiveEntertainment,
    pauseEntertainment, 
    finishEntertainment 
} from "@/app/actions";
import useSound from "use-sound";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner"; // ✅ استيراد التوست

export default function Entertainment({ items: initialItems }: { items: any[] }) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const txt = t || {}; 
  const [mounted, setMounted] = useState(false);
  
  // Data State
  const [items, setItems] = useState(initialItems);
  useEffect(() => { setItems(initialItems); }, [initialItems]);
  useEffect(() => { setMounted(true); }, []);

  // UI States
  const [activeTab, setActiveTab] = useState<'game' | 'movie' | 'manga'>('game');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Search & Loading States
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sounds
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.5 });
  const [playDelete] = useSound('/sounds/delete.mp3', { volume: 0.5 });

  // Filter Logic
  const filteredItems = items.filter(i => i.type === activeTab && i.status !== 'completed');
  const activeItem = filteredItems.find(i => i.status === 'active');
  const backlogItems = filteredItems.filter(i => i.status !== 'active');

  useEffect(() => {
    if (isAddOpen || previewItem || deleteId) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isAddOpen, previewItem, deleteId]);

  // Safety Filter
  const isContentSafe = (item: any) => {
      const unsafeKeywords = ['hentai', 'porn', 'xxx', 'erotic', 'adult', '18+', 'sex', 'nude'];
      const unsafeRatings = ['R18+', 'RX', 'X', 'NC-17']; 
      const title = item.title?.toLowerCase() || "";
      const desc = item.description?.toLowerCase() || "";
      const genres = Array.isArray(item.genres) ? item.genres.join(' ').toLowerCase() : (item.genres?.toLowerCase() || "");
      if (item.isAdult === true || item.adult === true) return false;
      const hasUnsafeKeyword = unsafeKeywords.some(word => title.includes(word) || desc.includes(word) || genres.includes(word));
      if (hasUnsafeKeyword) return false;
      if (item.rating && unsafeRatings.includes(item.rating)) return false;
      return true;
  };

  // Handlers
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (query.length < 2) { setSearchResults([]); setIsSearching(false); return; } // Reduced length to 2 for Arabic

      setIsSearching(true);
      searchTimeout.current = setTimeout(async () => {
          // ✅ تمرير اللغة (lang) للسيرفر ليدعم البحث بالعربي إذا كانت الواجهة عربية أو النص عربي
          const res = await searchEntertainment(query, activeTab, lang);
          if (res.success) {
              const safeResults = res.results.filter(isContentSafe);
              setSearchResults(safeResults);
          }
          setIsSearching(false);
      }, 800);
  };

  const handleSelectResult = async (result: any) => {
      playClick();
      setPreviewItem({ ...result, loading: true });
      setIsLoadingDetails(true);
      // ✅ تمرير اللغة لجلب التفاصيل بالعربي إن وجدت
      const detailsRes = await getEntertainmentDetails(result.apiId, activeTab, lang);
      if (detailsRes.success) {
          if (!isContentSafe(detailsRes.details)) {
              setPreviewItem(null);
              toast.error(txt.ent_safety_msg || "Content flagged by safety protocol.");
          } else {
              setPreviewItem(prev => ({ ...prev, ...detailsRes.details, loading: false }));
          }
      } else {
          setPreviewItem(prev => ({ ...prev, description: "No details available.", loading: false }));
      }
      setIsLoadingDetails(false);
  };

  const handleConfirmAdd = async () => {
      if (!previewItem) return;
      setIsSubmitting(true);
      const dataToAdd = { 
          title: previewItem.title,
          description: previewItem.description,
          image: previewItem.image,
          backdrop: previewItem.backdrop, 
          rating: previewItem.rating,
          apiId: previewItem.apiId,
          type: activeTab 
      };
      const res = await addEntertainment(dataToAdd);
      setIsSubmitting(false);
      if(res.success) {
          playSuccess();
          setPreviewItem(null);
          setIsAddOpen(false);
          setSearchResults([]);
          if(inputRef.current) inputRef.current.value = "";
          
          // ✅ توست الإضافة
          toast.success(txt.toast_ent_added || "Added to Library 🎮", {
            style: { background: "#101010", color: "#fff", border: "1px solid #333" }
          });

          router.refresh();
      }
  };

  const handleActivate = async (id: string) => {
      playClick();
      const updated = items.map(i => {
          if (i.type !== activeTab) return i; 
          return { ...i, status: i._id === id ? 'active' : 'pending' };
      });
      setItems(updated);
      
      // ✅ توست التفعيل
      toast.success(txt.toast_ent_active || "Now Playing 🎬", {
        style: { background: "#db2777", color: "#fff", border: "1px solid #be185d" } // Pink theme
      });

      await setActiveEntertainment(id, activeTab);
      router.refresh();
  };

  const handlePause = async () => {
      playClick();
      const updated = items.map(i => i.status === 'active' ? { ...i, status: 'pending' } : i);
      setItems(updated);
      
      // ✅ توست الإيقاف
      toast(txt.toast_ent_paused || "Session Paused ⏸️");

      await pauseEntertainment();
      router.refresh();
  };

  const handleFinish = async (id: string) => {
      playSuccess();
      const updated = items.map(i => i._id === id ? { ...i, status: 'completed' } : i);
      setItems(updated);
      
      // ✅ توست الإنهاء (ذهبي)
      toast.success(txt.toast_ent_finished || "Completed! +XP Earned 🏆", {
        style: { background: "#ca8a04", color: "#fff", border: "1px solid #eab308" }
      });

      await finishEntertainment(id);
      router.refresh();
  };

  const handleDelete = async () => {
      if(!deleteId) return;
      playDelete();
      const updated = items.filter(i => i._id !== deleteId);
      setItems(updated);
      
      await deleteEntertainment(deleteId);
      setDeleteId(null);
      
      // ✅ توست الحذف
      toast(txt.toast_ent_deleted || "Item Removed 🗑️", {
          style: { border: '1px solid #ef4444', color: '#fca5a5' }
      });

      router.refresh();
  };

  // --- 🛠️ Helpers for Icons & Labels ---
  const getIcon = (type: string) => {
      if(type === 'game') return <Gamepad2 size={18}/>;
      if(type === 'movie') return <Clapperboard size={18}/>;
      return <Book size={18}/>;
  };

  const getAddLabel = (type: string) => {
      if(type === 'game') return txt.ent_add_game || "ADD GAME";
      if(type === 'movie') return txt.ent_add_movie || "ADD MOVIE";
      return txt.ent_add_manga || "ADD MANGA";
  };

  const getSearchPlaceholder = (type: string) => {
      if(type === 'game') return txt.ent_search_game || "Search games...";
      if(type === 'movie') return txt.ent_search_movie || "Search movies...";
      return txt.ent_search_manga || "Search manga...";
  };

  const getTabLabel = (type: string) => {
      if(type === 'game') return txt.ent_play || "GAMES";
      if(type === 'movie') return txt.ent_watch || "MOVIES";
      return txt.ent_read || "MANGA";
  };

  return (
    <>
    <div className="bg-gradient-to-b from-[#0F0F0F] to-[#050505] rounded-[32px] border border-white/5 p-6 h-[500px] flex flex-col relative overflow-hidden group shadow-2xl" dir="ltr">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-pink-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header & Tabs */}
      <div className="flex flex-col gap-6 mb-6 relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                  <span className="p-2 bg-pink-500/10 rounded-xl text-pink-500 border border-pink-500/20"><MonitorPlay size={20} /></span>
                  {txt.entertainment_title || "MEDIA HUB"}
              </h3>
              <button onClick={() => { playClick(); setIsAddOpen(true); setSearchResults([]); if(inputRef.current) inputRef.current.value=""; }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5"><Plus size={20} /></button>
          </div>
          
          <div className="flex bg-[#121212] p-1 rounded-xl border border-white/5 relative">
              {(['game', 'movie', 'manga'] as const).map(tab => (
                  <button 
                      key={tab} 
                      onClick={() => { playClick(); setActiveTab(tab); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all relative z-10 ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                      {activeTab === tab && (
                          <motion.div layoutId="activeEntTab" className="absolute inset-0 bg-pink-600 rounded-lg -z-10 shadow-lg shadow-pink-900/50" />
                      )}
                      {getIcon(tab)} {getTabLabel(tab)}
                  </button>
              ))}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-6 relative z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {/* Active Item Card */}
          <AnimatePresence mode="wait">
              {activeItem ? (
                  <motion.div layoutId={activeItem._id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-[#151515] rounded-2xl overflow-hidden border border-pink-500/30 group/hero shadow-[0_0_30px_rgba(236,72,153,0.15)]">
                      {activeItem.image && (
                          <div className="absolute inset-0 opacity-40 group-hover/hero:opacity-50 transition-opacity">
                              <img src={activeItem.backdrop || activeItem.image} className="w-full h-full object-cover blur-sm scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                          </div>
                      )}
                      <div className="absolute inset-0 p-5 flex flex-col justify-center items-start z-10">
                          <div className="flex items-center gap-2 text-[10px] font-black text-pink-400 tracking-[0.2em] uppercase mb-2 animate-pulse bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                              <Play size={10} fill="currentColor"/> {txt.ent_active || "NOW PLAYING"}
                          </div>
                          <h4 className="font-black text-white text-2xl md:text-3xl mb-1 line-clamp-1 drop-shadow-lg">{activeItem.title}</h4>
                          <div className="flex items-center gap-3 mb-4">
                              <span className="text-[10px] bg-yellow-500 text-black font-bold px-2 py-0.5 rounded flex items-center gap-1"><Star size={8} fill="currentColor"/> {activeItem.rating}</span>
                          </div>
                          <div className="flex gap-2 mt-auto">
                              <button onClick={(e) => { e.stopPropagation(); handleFinish(activeItem._id); }} className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-[10px] transition-colors flex items-center gap-1 shadow-lg">
                                  <CheckCircle size={12}/> {txt.finish || "COMPLETE"}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handlePause(); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors backdrop-blur-md border border-white/10">
                                  <Pause size={14} fill="currentColor"/>
                              </button>
                          </div>
                      </div>
                  </motion.div>
              ) : (
                  <div className="h-32 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-600 bg-white/[0.01]">
                      {getIcon(activeTab)}
                      <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">{txt.ent_idle || "SYSTEM IDLE"}</p>
                  </div>
              )}
          </AnimatePresence>

          {/* Backlog Grid */}
          <div className="space-y-3">
              {backlogItems.length > 0 && (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 tracking-widest uppercase pl-1">
                      <Clapperboard size={12}/> {txt.ent_backlog || "BACKLOG"} <span className="text-white bg-white/10 px-1.5 rounded">{backlogItems.length}</span>
                  </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {backlogItems.map(item => (
                      <motion.div key={item._id} layoutId={item._id} className="group relative aspect-[2/3] bg-[#121212] rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-pink-500/50 transition-all shadow-lg">
                          {item.image ? (
                              <img src={item.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"/>
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#151515]">
                                  {getIcon(activeTab)}
                              </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                              <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight mb-2">{item.title}</h4>
                              <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); handleActivate(item._id); }} className="flex-1 py-1.5 bg-pink-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center"><Play size={10} fill="currentColor"/></button>
                                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(item._id); }} className="p-1.5 bg-white/10 text-white rounded-lg hover:bg-red-500/50"><Trash2 size={10}/></button>
                              </div>
                          </div>
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-yellow-500 flex items-center gap-0.5 border border-white/10">
                              <Star size={8} fill="currentColor"/> {item.rating}
                          </div>
                      </motion.div>
                  ))}
              </div>
          </div>
      </div>
    </div>

    {/* 🔥 PORTALS */}
    {mounted && createPortal(
        <AnimatePresence>
            {/* 1. SEARCH MODAL */}
            {isAddOpen && !previewItem && (
                <motion.div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <motion.div 
                        initial={{y:50, opacity:0}} animate={{y:0, opacity:1}} exit={{y:50, opacity:0}} 
                        className="bg-[#151515] border border-white/10 p-6 rounded-[32px] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                {getIcon(activeTab)} {getAddLabel(activeTab)}
                            </h3>
                            <button onClick={() => { setIsAddOpen(false); setSearchResults([]); }} className="p-2 bg-white/5 rounded-full hover:text-white text-gray-500"><X size={18}/></button>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl mb-4 flex items-start gap-3">
                            <ShieldCheck className="text-blue-400 flex-shrink-0" size={18} />
                            <div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase">{txt.ent_safety_title || "Safety Protocol Active"}</p>
                                <p className="text-[10px] text-blue-300/70">{txt.ent_safety_msg || "Adult content is automatically filtered from search results."}</p>
                            </div>
                        </div>

                        <div className="relative mb-6">
                            <Search className={`absolute top-3.5 text-gray-500 ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={18}/>
                            <input 
                                ref={inputRef} 
                                onChange={handleSearchInput} 
                                placeholder={getSearchPlaceholder(activeTab)} 
                                className={`w-full bg-black/30 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-pink-500 transition-colors ${lang === 'ar' ? 'pr-12' : 'pl-12'}`} 
                                autoFocus 
                            />
                            {isSearching && <Loader2 className={`absolute top-3.5 text-pink-500 animate-spin ${lang === 'ar' ? 'left-4' : 'right-4'}`} size={18}/>}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 p-1">
                            {searchResults.map((result, idx) => (
                                <motion.div key={idx} onClick={() => handleSelectResult(result)} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-pink-500/50 hover:bg-white/10 transition-colors cursor-pointer group" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                                    <div className="w-16 h-24 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                        {result.image ? <img src={result.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-700">{getIcon(activeTab)}</div>}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm line-clamp-1">{result.title}</h4>
                                        <p className="text-[10px] text-gray-400 line-clamp-2 mt-1">{result.shortDescription}</p> 
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded flex items-center gap-1"><Star size={8} fill="currentColor"/> {result.rating}</span>
                                            <span className="text-[10px] text-gray-500 border border-white/10 px-2 py-0.5 rounded">{result.year}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={20}/></div>
                                </motion.div>
                            ))}
                            {!isSearching && searchResults.length === 0 && inputRef.current && inputRef.current.value.length > 2 && <p className="text-center text-gray-600 text-xs py-10">{txt.ent_no_results || "No safe results found."}</p>}
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* 2. PREVIEW MODAL */}
            {previewItem && (
                <motion.div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <motion.div 
                        initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} 
                        className="bg-[#101010] border border-white/10 rounded-[40px] w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden shadow-2xl"
                        dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    >
                        {previewItem.backdrop && (
                            <div className="absolute inset-0 h-2/3 opacity-30 mask-image-b-0 pointer-events-none">
                                <img src={previewItem.backdrop} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/60 to-transparent" />
                            </div>
                        )}

                        <button onClick={() => setPreviewItem(null)} className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md rounded-full hover:bg-white/20 text-white z-20 transition-colors"><X size={20}/></button>

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 p-8 h-full overflow-hidden">
                            <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                                    {previewItem.image ? <img src={previewItem.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{getIcon(activeTab)}</div>}
                                </div>
                                <button onClick={handleConfirmAdd} disabled={isSubmitting} className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-pink-900/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                                    {isSubmitting ? <Loader2 className="animate-spin"/> : <>{txt.ent_add_btn || "ADD TO LIBRARY"} <Plus size={20}/></>}
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-2 pb-10">
                                <div className="mb-6">
                                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">{previewItem.title}</h2>
                                    <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-400">
                                        <span className="bg-white/10 px-3 py-1 rounded-full text-white">{previewItem.year || "N/A"}</span>
                                        <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full flex items-center gap-1"><Star size={12} fill="currentColor"/> {previewItem.rating}</span>
                                        {previewItem.genres && <span className="text-gray-500 uppercase tracking-wider border border-white/10 px-3 py-1 rounded-full">{previewItem.genres}</span>}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-8">
                                    {isLoadingDetails ? (
                                        <div className="h-40 flex items-center justify-center text-gray-500 gap-2"><Loader2 className="animate-spin"/> {txt.loading || "LOADING ASSETS..."}</div>
                                    ) : (
                                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line border-l-2 border-pink-500 pl-4">{previewItem.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* DELETE CONFIRM */}
            {deleteId && (
                <motion.div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-[#121212] border border-red-500/30 p-8 rounded-[32px] w-full max-w-sm text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-500" size={32}/></div>
                        <h3 className="text-xl font-bold text-white mb-2">{txt.delete_confirm_title || "Delete Item?"}</h3>
                        <div className="flex gap-3 mt-6"><button onClick={() => setDeleteId(null)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-gray-400">{txt.cancel}</button><button onClick={handleDelete} className="flex-1 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-bold text-white">{txt.delete}</button></div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )}
    </>
  );
}