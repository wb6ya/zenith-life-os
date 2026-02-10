"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ListTodo, StickyNote, Plus, CheckCircle, 
    Trash2, PenLine, Loader2 
} from "lucide-react";
import useSound from "use-sound";
import { useLanguage } from "@/context/LanguageContext";

export default function ProductivityHub() {
    const { t, lang } = useLanguage();
    const txt = t || {};

    const [activePanel, setActivePanel] = useState<'todo' | 'notes'>('todo');
    const [quickTodos, setQuickTodos] = useState<{id: number, text: string, done: boolean}[]>([]);
    const [todoInput, setTodoInput] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [mounted, setMounted] = useState(false);

    // 🔊 Sounds
    const [playCheck] = useSound('/sounds/click.mp3', { volume: 0.5 });

    // Load Local Data
    useEffect(() => { 
        setMounted(true); 
        const savedTodos = localStorage.getItem('zenith_quick_todos');
        if (savedTodos) setQuickTodos(JSON.parse(savedTodos));
        
        const savedNotes = localStorage.getItem('zenith_quick_notes');
        if (savedNotes) setNoteContent(savedNotes);
    }, []);

    // Save Data
    useEffect(() => { if (mounted) localStorage.setItem('zenith_quick_todos', JSON.stringify(quickTodos)); }, [quickTodos, mounted]);
    useEffect(() => { if (mounted) localStorage.setItem('zenith_quick_notes', noteContent); }, [noteContent, mounted]);

    // --- Handlers ---
    const handleAddTodo = () => {
        if (todoInput.trim()) {
            setQuickTodos([...quickTodos, { id: Date.now(), text: todoInput, done: false }]);
            setTodoInput(""); 
            playCheck();
        }
    };

    const handleKeyDown = (e: any) => { if (e.key === 'Enter') handleAddTodo(); };

    const toggleQuickTodo = (id: number) => {
        setQuickTodos(quickTodos.map(t => t.id === id ? { ...t, done: !t.done } : t));
        playCheck();
    };
    const deleteQuickTodo = (id: number) => { setQuickTodos(quickTodos.filter(t => t.id !== id)); };

    return (
        <div className="h-full flex flex-col bg-[#0A0A0A] relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] pointer-events-none" />

            {/* Tabs Header */}
            <div className="flex items-center justify-center p-6 pb-2 relative z-10">
                <div className="flex bg-[#151515] p-1 rounded-xl border border-white/5 w-full">
                    <button 
                        onClick={() => setActivePanel('todo')} 
                        className={`flex-1 py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider ${activePanel === 'todo' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} 
                    >
                        <ListTodo size={16} /> {txt.panel_todo || "To-Do"}
                    </button>
                    <button 
                        onClick={() => setActivePanel('notes')} 
                        className={`flex-1 py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider ${activePanel === 'notes' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`} 
                    >
                        <StickyNote size={16} /> {txt.panel_notes || "Notes"}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2 relative z-10">
                <AnimatePresence mode="wait">
                    
                    {/* 2. ✅ TODO PANEL */}
                    {activePanel === 'todo' && (
                        <motion.div key="todo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4 h-full flex flex-col">
                            
                            <div className="relative group shadow-lg flex-shrink-0">
                                <input 
                                    type="text" 
                                    value={todoInput}
                                    onChange={(e) => setTodoInput(e.target.value)}
                                    placeholder={txt.todo_placeholder || "Add task..."} 
                                    onKeyDown={handleKeyDown} 
                                    className={`w-full bg-[#151515] border border-white/10 rounded-2xl py-4 text-sm font-medium text-white focus:outline-none focus:border-blue-500 focus:bg-[#1a1a1a] transition-all ${lang === 'ar' ? 'pr-5 pl-14' : 'pl-5 pr-14'}`} 
                                />
                                <button 
                                    onClick={handleAddTodo}
                                    className={`absolute top-2 bottom-2 ${lang === 'ar' ? 'left-2' : 'right-2'} w-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all active:scale-95 shadow-md`}
                                >
                                    <Plus size={20}/>
                                </button>
                            </div>

                            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                {quickTodos.length > 0 ? quickTodos.map((t) => (
                                    <motion.div layout key={t.id} className="flex items-center gap-3 p-4 bg-[#151515]/60 border border-white/5 rounded-2xl group hover:border-white/10 transition-colors shadow-sm">
                                        <button onClick={() => toggleQuickTodo(t.id)} className={`flex-shrink-0 transition-colors ${t.done ? 'text-green-500' : 'text-gray-500 group-hover:text-white'}`}>
                                            {t.done ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                        </button>
                                        <span className={`flex-1 text-sm font-medium ${t.done ? 'text-gray-600 line-through' : 'text-gray-200'}`}>{t.text}</span>
                                        <button onClick={() => deleteQuickTodo(t.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                    </motion.div>
                                )) : (
                                    <div className="h-40 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-2xl text-gray-500">
                                        <ListTodo size={32} className="mb-2 opacity-30"/>
                                        <p className="text-xs font-bold tracking-widest opacity-50">{txt.todo_empty || "No tasks"}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* 3. 📝 NOTES PANEL */}
                    {activePanel === 'notes' && (
                        <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full flex flex-col space-y-4">
                            <div className="flex-1 relative group h-full">
                                <div className="absolute inset-0 bg-yellow-500/5 blur-3xl opacity-20 pointer-events-none" />
                                <textarea 
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                    placeholder={txt.notes_placeholder || "Type here..."}
                                    className="w-full h-full bg-[#151515] border border-white/10 rounded-3xl p-6 text-sm text-white/90 leading-relaxed font-serif tracking-wide focus:outline-none focus:border-yellow-500/30 resize-none transition-colors custom-scrollbar shadow-inner placeholder:text-gray-600"
                                />
                                <div className="absolute bottom-4 right-4 text-gray-600 pointer-events-none">
                                    <PenLine size={16} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}