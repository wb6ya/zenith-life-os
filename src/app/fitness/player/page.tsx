"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getActiveWorkoutSession, completeDailySession } from "@/app/actions";
import { getYouTubeID } from "@/lib/youtube";
import { 
  CheckCircle, LogOut, Pause, Play, 
  Music, X, Volume2, VolumeX, SkipForward, Zap, ArrowRight, Trophy, Loader2,
  Maximize2, Minimize2
} from "lucide-react";
import useSound from "use-sound";
import confetti from "canvas-confetti";
import { useLanguage } from "@/context/LanguageContext";
import { getRandomQuote } from "@/lib/quotes";

const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "circOut" } },
    exit: { opacity: 0, scale: 1.02, transition: { duration: 0.3 } }
};

export default function WorkoutPlayer() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const txt = t || {}; 

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [planId, setPlanId] = useState("");
  const [phase, setPhase] = useState("loading"); // loading, intro, countdown, work, rest, finished
  const [exIndex, setExIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(1);
  const [timer, setTimer] = useState(0);
  const [initialRestTime, setInitialRestTime] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [quote, setQuote] = useState("");
  
  // 🎵 Spotify Configuration
  const [showSpotify, setShowSpotify] = useState(false);
  // رابط قائمة تشغيل حقيقي (Workout Phonk)
  const [spotifyLink] = useState("https://open.spotify.com/embed/playlist/3akKEeJ4dABW1wg0OoWvPt?utm_source=generator&theme=0"); 
  
  const [volume, setVolume] = useState(0.5); // Video Volume
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const timerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const effectiveVolume = isMuted ? 0 : volume;
  const [playTick] = useSound('/sounds/click.mp3', { volume: effectiveVolume * 0.5 });
  const [playWhistle] = useSound('/sounds/success.mp3', { volume: effectiveVolume });
  const [playFinish] = useSound('/sounds/levelup.mp3', { volume: effectiveVolume });

  useEffect(() => {
    async function init() {
      const res = await getActiveWorkoutSession();
      if (res.status === 'ready') {
        setSessionData(res.data);
        setPlanId(res.planId);
        setPhase("intro");
        setQuote(getRandomQuote(lang));
        setLoading(false);
      } else {
        router.push("/");
      }
    }
    init();
  }, []);

  useEffect(() => {
    if ((phase === 'work' || phase === 'rest' || phase === 'countdown') && !isPaused && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer((t) => t - 1);
        if (timer <= 4 && timer > 0) playTick();
      }, 1000);
    } else if (timer === 0 && !isPaused && !['intro', 'finished', 'loading'].includes(phase)) {
        handleTimerComplete();
    }
    return () => clearTimeout(timerRef.current);
  }, [timer, isPaused, phase]);

  // التحكم بصوت الفيديو
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
        const action = isPaused ? 'pauseVideo' : 'playVideo';
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: action, args: [] }), '*');
        const volLevel = isMuted ? 0 : volume * 100;
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [volLevel] }), '*');
    }
  }, [isPaused, volume, isMuted]);

  const handleTimerComplete = () => {
    playWhistle();
    if (phase === 'countdown') setPhase('work');
    else if (phase === 'rest') { setQuote(getRandomQuote(lang)); startNextSet(); }
  };

  const startWorkout = () => { setPhase("countdown"); setTimer(5); };
  
  const finishSet = () => {
    playTick();
    if (!sessionData?.exercises?.length) { completeWorkout(); return; }
    const currentEx = sessionData.exercises[exIndex];
    if (setIndex < currentEx.sets) { 
        const rest = currentEx.restBetweenSets || 30;
        setInitialRestTime(rest); setTimer(rest); setPhase("rest"); setQuote(getRandomQuote(lang));
    } else { 
        if (exIndex < sessionData.exercises.length - 1) { 
            setInitialRestTime(60); setTimer(60); setPhase("rest"); setQuote(getRandomQuote(lang));
        } else { completeWorkout(); } 
    }
  };

  const startNextSet = () => {
    if (!sessionData?.exercises?.length) return;
    const currentEx = sessionData.exercises[exIndex];
    if (phase === 'rest') {
        if (setIndex < currentEx.sets) { setSetIndex(s => s + 1); setPhase('work'); }
        else { setExIndex(i => i + 1); setSetIndex(1); setPhase('work'); }
    }
  };

  const completeWorkout = async () => {
    setPhase("finished"); playFinish();
    const end = Date.now() + 3 * 1000;
    const colors = ['#06b6d4', '#ffffff'];
    (function frame() {
        confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
        confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
    await completeDailySession(planId);
  };

  const currentEx = sessionData?.exercises?.[exIndex];
  const nextEx = sessionData?.exercises?.[exIndex + 1];
  const isRest = phase === 'rest';
  
  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-500"><Loader2 className="animate-spin" size={64}/></div>;

  // 1️⃣ INTRO PHASE
  if (phase === 'intro') return (
    <div className="h-screen w-screen bg-black relative overflow-hidden flex flex-col items-center justify-center text-center p-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000')] bg-cover bg-center opacity-30 animate-pulse-slow scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
        
        <motion.div variants={pageVariants} initial="initial" animate="animate" className="relative z-10 max-w-2xl">
            <div className="mb-8 inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-900/20 text-cyan-400 text-xs font-black tracking-[0.3em] uppercase">
                {txt.player_day || "DAY"} {sessionData.dayNumber}
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none uppercase">{sessionData.title}</h1>
            <p className="text-xl md:text-2xl text-gray-400 font-serif italic mb-12" dir={lang === 'ar' ? 'rtl' : 'ltr'}>"{quote}"</p>
            <button onClick={startWorkout} className="group relative px-10 py-5 bg-white text-black font-black text-lg rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                <span className="relative flex items-center gap-3">{txt.player_init || "INITIATE SEQUENCE"} <ArrowRight className={`transition-transform ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} /></span>
            </button>
        </motion.div>
    </div>
  );

  // 2️⃣ COUNTDOWN PHASE
  if (phase === 'countdown') return (
    <div className="h-screen w-screen bg-cyan-600 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent animate-pulse" />
        <motion.div key={timer} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-[300px] font-black text-white leading-none drop-shadow-2xl relative z-10">{timer}</motion.div>
        <p className="mt-8 text-2xl text-cyan-100 font-black tracking-widest uppercase flex items-center gap-2"><Zap fill="currentColor"/> {txt.player_get_ready || "GET READY"}</p>
    </div>
  );

  // 3️⃣ FINISHED PHASE
  if (phase === 'finished') return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-500/10 blur-[100px]" />
        <motion.div variants={pageVariants} initial="initial" animate="animate" className="relative z-10">
            <div className="w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_60px_rgba(234,179,8,0.4)] animate-bounce">
                <Trophy size={80} className="text-black" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight uppercase">{txt.player_complete_title || "PROTOCOL COMPLETE"}</h1>
            <p className="text-green-400 font-mono text-xl mb-12 tracking-widest">+200 XP {txt.player_xp_reward || "AWARDED"}</p>
            <button onClick={() => router.push('/')} className="px-12 py-5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-xl">{txt.player_return || "RETURN TO BASE"}</button>
        </motion.div>
    </div>
  );

  // 4️⃣ MAIN WORK / REST UI
  return (
    <div className={`h-screen w-screen flex flex-col text-white overflow-hidden relative transition-colors duration-1000 ${isRest ? "bg-[#0f0500]" : "bg-[#050505]"}`} dir="ltr">
        
        {/* Top Control Bar */}
        <div className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <button onClick={() => { setIsPaused(true); setShowExitModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-500/20 hover:text-red-500 text-gray-300 rounded-full backdrop-blur-md transition-colors text-xs font-bold tracking-widest">
                <LogOut size={14} /> {txt.player_quit || "EXIT"}
            </button>
            
            <div className="flex items-center gap-3">
                {/* Volume Toggle */}
                <div className="relative group">
                    <button onClick={() => setShowVolumeSlider(!showVolumeSlider)} className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md transition-colors">
                        {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    {showVolumeSlider && (
                        <div className="absolute top-12 right-0 bg-black/90 p-3 rounded-xl border border-white/10 w-24 flex flex-col items-center gap-2 shadow-xl">
                            <span className="text-[9px] font-bold text-gray-400">VIDEO</span>
                            <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }} className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer accent-cyan-500"/>
                        </div>
                    )}
                </div>
                
                {/* Spotify Toggle */}
                <button onClick={() => setShowSpotify(!showSpotify)} className={`p-2.5 rounded-full transition-colors backdrop-blur-md ${showSpotify ? 'bg-green-600 text-white shadow-[0_0_15px_#16a34a]' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                    <Music size={18} />
                </button>
            </div>
        </div>

        {/* Content Layer */}
        <div className="flex-1 w-full h-full relative flex flex-col items-center justify-center p-4">
            
            {/* الخلفية الضبابية (البيئة) */}
            <div className="absolute inset-0 z-0">
                {currentEx?.mediaUrl && (
                    <img src={currentEx.mediaUrl.includes('youtube') ? `https://img.youtube.com/vi/${getYouTubeID(currentEx.mediaUrl)}/maxresdefault.jpg` : currentEx.mediaUrl} className="w-full h-full object-cover opacity-20 blur-3xl scale-110" />
                )}
                <div className={`absolute inset-0 bg-black/40 ${isRest ? 'bg-orange-900/10' : ''}`} />
            </div>

            <AnimatePresence mode="wait">
                {isRest ? (
                    // 🧘 REST MODE UI
                    <motion.div key="rest" {...pageVariants} className="relative z-10 w-full max-w-lg text-center">
                        {/* Circular Timer */}
                        <div className="relative mb-12 mx-auto w-72 h-72">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="50%" cy="50%" r="45%" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                                <motion.circle cx="50%" cy="50%" r="45%" stroke="#f97316" strokeWidth="6" fill="transparent" strokeLinecap="round" initial={{ pathLength: 1 }} animate={{ pathLength: timer / initialRestTime }} transition={{ duration: 1, ease: "linear" }} className="drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-8xl font-black text-white tabular-nums tracking-tighter">{timer}</span>
                                <span className="text-orange-500 font-bold tracking-[0.3em] text-sm uppercase mt-2">{txt.player_resting || "RECOVER"}</span>
                            </div>
                        </div>

                        {/* Next Exercise Preview */}
                        <div className="bg-black/40 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex items-center justify-between shadow-2xl" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                            <div className="text-left rtl:text-right overflow-hidden mr-4 rtl:ml-4 rtl:mr-0">
                                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">{txt.player_up_next || "UP NEXT"}</p>
                                <h3 className="text-xl font-black text-white line-clamp-1">{setIndex > currentEx?.sets ? (nextEx?.name || txt.player_finish || "FINISH") : currentEx?.name}</h3>
                            </div>
                            <button onClick={() => setTimer(0)} className="h-12 w-12 flex-shrink-0 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors transform ltr:rotate-0 rtl:rotate-180">
                                <SkipForward size={20} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    // 💪 WORK MODE UI
                    <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full h-full flex flex-col">
                        
                        {/* 🖥️ Cinema Player (Centered & Fixed Ratio) */}
                        <div className="flex-1 flex items-center justify-center w-full max-h-[60vh] my-auto">
                            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                                {currentEx?.mediaUrl?.includes('youtube') ? (
                                    <iframe ref={iframeRef} src={`https://www.youtube.com/embed/${getYouTubeID(currentEx.mediaUrl)}?autoplay=1&controls=0&loop=1&playlist=${getYouTubeID(currentEx.mediaUrl)}&enablejsapi=1&rel=0&modestbranding=1`} className="w-full h-full object-cover" allow="autoplay; encrypted-media"></iframe>
                                ) : (
                                    <img src={currentEx?.mediaUrl || "https://media.giphy.com/media/3o7TKSjRrfIPjeiQQo/giphy.gif"} className="w-full h-full object-contain" />
                                )}
                                
                                {/* Pause Overlay */}
                                {isPaused && (
                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                        <div className="bg-white/10 p-5 rounded-full border border-white/20 mb-4 animate-pulse"><Pause size={48} className="text-white" /></div>
                                        <p className="font-black tracking-[0.5em] text-xl text-white">{txt.player_paused || "PAUSED"}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Bar (Below Player) */}
                        <div className="w-full px-6 pb-24 z-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                                <div className="w-full">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-cyan-600 rounded-lg text-[10px] font-bold tracking-widest text-black shadow-[0_0_10px_rgba(8,145,178,0.4)]">
                                            {txt.player_set || "SET"} {setIndex} <span className="opacity-50">/</span> {currentEx?.sets}
                                        </span>
                                        <span className="text-gray-400 text-xs font-mono bg-white/5 px-2 py-1 rounded border border-white/5">
                                            {currentEx?.restBetweenSets}s {txt.player_rest || "REST"}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-black text-white leading-none uppercase tracking-tight drop-shadow-lg line-clamp-2">
                                        {currentEx?.name}
                                    </h1>
                                </div>
                                <div className="flex-shrink-0 text-right hidden md:block">
                                    <span className="block text-7xl font-black text-white/20 leading-none">{currentEx?.reps}</span>
                                    <span className="text-xs font-bold text-gray-500 tracking-[0.3em] uppercase">{txt.player_reps || "REPS"}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Bottom Controls (Sleek Floating Bar) */}
        {!isRest && (
            <div className="fixed bottom-8 w-full px-6 z-40 flex justify-center">
                <div className="bg-[#151515]/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl max-w-lg w-full">
                    <button onClick={() => setIsPaused(!isPaused)} className="h-14 w-20 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-95 border-r border-white/5">
                        {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                    </button>
                    <button onClick={finishSet} disabled={isPaused} className={`flex-1 h-14 rounded-xl font-bold text-sm tracking-widest flex items-center justify-center gap-3 transition-all ${isPaused ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200 active:scale-95 shadow-lg'}`}>
                        <CheckCircle size={20} /> {txt.player_complete_set || "COMPLETE SET"}
                    </button>
                </div>
            </div>
        )}

        {/* Exit Modal */}
        <AnimatePresence>
            {showExitModal && (
                <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
                    <motion.div initial={{scale:0.9, opacity: 0}} animate={{scale:1, opacity: 1}} className="bg-[#101010] border border-white/10 p-8 rounded-[40px] max-w-sm w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><LogOut className="text-red-500" size={32}/></div>
                        <h3 className="text-2xl font-black mb-2 text-white">{txt.player_abort_title || "ABORT SESSION?"}</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed text-sm">{txt.player_abort_msg || "Progress will be lost."}</p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowExitModal(false); setIsPaused(false); }} className="flex-1 py-3.5 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 text-xs tracking-wider">{txt.player_resume || "RESUME"}</button>
                            <button onClick={() => router.push('/')} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 shadow-lg shadow-red-900/20 text-xs tracking-wider">{txt.player_quit || "QUIT"}</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* 🎵 Fixed Spotify Overlay (Better UX) */}
        <div className={`fixed bottom-28 right-6 z-[60] transition-all duration-500 origin-bottom-right ${showSpotify ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`} style={{ width: '340px' }}>
            <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-[#181818] p-3 flex justify-between items-center border-b border-white/5">
                    <span className="text-[10px] font-bold text-green-500 flex items-center gap-2 uppercase tracking-widest"><Music size={14}/> {txt.player_spotify || "Spotify"}</span>
                    <button onClick={() => setShowSpotify(false)} className="bg-white/10 p-1.5 rounded-full hover:bg-white/20 transition-colors"><X size={12} className="text-white"/></button>
                </div>
                <div className="bg-black">
                    <iframe 
                        style={{borderRadius: '0'}} 
                        src={spotifyLink} 
                        width="100%" 
                        height="80" 
                        frameBorder="0" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                    ></iframe>
                </div>
            </div>
        </div>
    </div>
  );
}