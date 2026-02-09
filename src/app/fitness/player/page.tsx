"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getActiveWorkoutSession, completeDailySession } from "@/app/actions";
import { getYouTubeID } from "@/lib/youtube";
import { 
  CheckCircle, Clock, Coffee, Trophy, Loader2, LogOut, Pause, Play, 
  Music, X, Volume2, VolumeX, SkipForward, Zap, ArrowRight, ShieldCheck 
} from "lucide-react";
import useSound from "use-sound";
import confetti from "canvas-confetti";
import { useLanguage } from "@/context/LanguageContext";
import { getRandomQuote } from "@/lib/quotes";

const pageVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "circOut" } },
    exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } }
};

export default function WorkoutPlayer() {
  const router = useRouter();
  const { lang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [planId, setPlanId] = useState("");
  const [phase, setPhase] = useState("loading");
  const [exIndex, setExIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(1);
  const [timer, setTimer] = useState(0);
  const [initialRestTime, setInitialRestTime] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [quote, setQuote] = useState("");
  const [showSpotify, setShowSpotify] = useState(false);
  const [spotifyLink] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP?utm_source=generator&theme=0"); // Default Gym Beats
  const [volume, setVolume] = useState(0.5);
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
    confetti({ particleCount: 300, spread: 120, origin: { y: 0.6 }, colors: ['#06b6d4', '#3b82f6', '#8b5cf6'] });
    await completeDailySession(planId);
  };

  const txt = t || {};
  const currentEx = sessionData?.exercises?.[exIndex];
  const nextEx = sessionData?.exercises?.[exIndex + 1];
  const isRest = phase === 'rest';
  
  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-500"><Loader2 className="animate-spin" size={64}/></div>;

  if (phase === 'intro') return (
    <div className="h-screen w-screen bg-black relative overflow-hidden flex flex-col items-center justify-center text-center p-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000')] bg-cover bg-center opacity-30 animate-pulse-slow scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
        
        <motion.div variants={pageVariants} initial="initial" animate="animate" className="relative z-10 max-w-2xl">
            <div className="mb-8 inline-block px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-900/20 text-cyan-400 text-xs font-black tracking-[0.3em] uppercase">DAY {sessionData.dayNumber}</div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none">{sessionData.title}</h1>
            <p className="text-2xl text-gray-400 font-serif italic mb-12">"{quote}"</p>
            <button onClick={startWorkout} className="group relative px-10 py-5 bg-white text-black font-black text-lg rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                <span className="relative flex items-center gap-3">INITIATE SEQUENCE <ArrowRight className="group-hover:translate-x-1 transition-transform" /></span>
            </button>
        </motion.div>
    </div>
  );

  if (phase === 'countdown') return (
    <div className="h-screen w-screen bg-cyan-600 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent animate-pulse" />
        <motion.div key={timer} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-[300px] font-black text-white leading-none drop-shadow-2xl relative z-10">{timer}</motion.div>
        <p className="mt-8 text-2xl text-cyan-100 font-black tracking-widest uppercase flex items-center gap-2"><Zap fill="currentColor"/> GET READY</p>
    </div>
  );

  if (phase === 'finished') return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-500/10 blur-[100px]" />
        <motion.div variants={pageVariants} initial="initial" animate="animate" className="relative z-10">
            <div className="w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_60px_rgba(234,179,8,0.4)] animate-bounce-slow">
                <Trophy size={80} className="text-black" />
            </div>
            <h1 className="text-6xl font-black text-white mb-6 tracking-tight">PROTOCOL COMPLETE</h1>
            <p className="text-green-400 font-mono text-xl mb-12 tracking-widest">+200 XP AWARDED</p>
            <button onClick={() => router.push('/')} className="px-12 py-5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors shadow-xl">RETURN TO BASE</button>
        </motion.div>
    </div>
  );

  // WORK / REST UI
  return (
    <div className={`h-screen w-screen flex flex-col text-white overflow-hidden relative transition-colors duration-1000 ${isRest ? "bg-[#0f0500]" : "bg-[#00050a]"}`} dir="ltr">
        
        {/* Top Bar */}
        <div className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-start">
            <button onClick={() => { setIsPaused(true); setShowExitModal(true); }} className="p-3 bg-white/10 hover:bg-red-500/20 hover:text-red-500 text-white rounded-full backdrop-blur-md transition-colors"><LogOut size={20} /></button>
            <div className="flex items-center gap-3">
                <button onClick={() => setShowVolumeSlider(!showVolumeSlider)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md">{isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                {showVolumeSlider && <div className="absolute top-16 right-6 bg-black/90 p-4 rounded-xl border border-white/10"><input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }} className="w-32 accent-white h-1.5 bg-white/20 rounded-lg cursor-pointer"/></div>}
                <button onClick={() => setShowSpotify(!showSpotify)} className={`p-3 rounded-full transition-colors backdrop-blur-md ${showSpotify ? 'bg-green-500 text-black' : 'bg-white/10 text-green-500'}`}><Music size={20} /></button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative flex flex-col justify-center items-center">
            <AnimatePresence mode="wait">
                {isRest ? (
                    <motion.div key="rest" {...pageVariants} className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-600/20 to-transparent pointer-events-none" />
                        <div className="relative mb-12">
                            <svg className="w-80 h-80 transform -rotate-90">
                                <circle cx="50%" cy="50%" r="45%" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="transparent" />
                                <motion.circle cx="50%" cy="50%" r="45%" stroke="#f97316" strokeWidth="8" fill="transparent" strokeLinecap="round" initial={{ pathLength: 1 }} animate={{ pathLength: timer / initialRestTime }} transition={{ duration: 1, ease: "linear" }} className="drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-8xl font-black text-white tabular-nums tracking-tighter">{timer}</span>
                                <span className="text-orange-500 font-bold tracking-[0.3em] text-sm uppercase mt-2">RESTING</span>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl w-full max-w-md backdrop-blur-md flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">UP NEXT</p>
                                <h3 className="text-xl font-bold text-white line-clamp-1">{setIndex > currentEx?.sets ? (nextEx?.name || "FINISH") : currentEx?.name}</h3>
                            </div>
                            <button onClick={() => setTimer(0)} className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><SkipForward size={24} /></button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 w-full h-full">
                        <div className="absolute inset-0 bg-black">
                            {currentEx?.mediaUrl?.includes('youtube') ? (
                                <iframe ref={iframeRef} src={`https://www.youtube.com/embed/${getYouTubeID(currentEx.mediaUrl)}?autoplay=1&controls=0&loop=1&playlist=${getYouTubeID(currentEx.mediaUrl)}&enablejsapi=1`} className="w-full h-full object-cover opacity-50 scale-110 pointer-events-none" allow="autoplay; encrypted-media"></iframe>
                            ) : (
                                <img src={currentEx?.mediaUrl || "https://media.giphy.com/media/3o7TKSjRrfIPjeiQQo/giphy.gif"} className="w-full h-full object-cover opacity-50" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        </div>
                        {isPaused && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                <div className="bg-white/10 p-6 rounded-full border border-white/20 mb-4 animate-pulse"><Pause size={64} className="text-white" /></div>
                                <p className="font-black tracking-[0.5em] text-2xl text-white">PAUSED</p>
                            </div>
                        )}
                        <div className="absolute bottom-40 left-0 right-0 px-8 z-10">
                            <div className="max-w-4xl mx-auto flex justify-between items-end">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-cyan-600 rounded-lg text-[10px] font-bold tracking-widest text-black">SET {setIndex} / {currentEx?.sets}</span>
                                        <span className="text-gray-400 text-xs font-mono bg-black/50 px-2 py-1 rounded">{currentEx?.restBetweenSets}s REST</span>
                                    </div>
                                    <h1 className="text-5xl md:text-7xl font-black text-white leading-none uppercase tracking-tight drop-shadow-lg">{currentEx?.name}</h1>
                                </div>
                                <div className="text-right hidden md:block">
                                    <span className="block text-9xl font-black text-white/20 leading-none">{currentEx?.reps}</span>
                                    <span className="text-sm font-bold text-gray-500 tracking-[0.5em] uppercase">REPS TARGET</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Controls */}
        {!isRest && (
            <div className="fixed bottom-0 w-full p-8 z-30 flex items-end gap-6 bg-gradient-to-t from-black to-transparent h-48">
                <button onClick={() => setIsPaused(!isPaused)} className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95">
                    {isPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} fill="currentColor" />}
                </button>
                <button onClick={finishSet} disabled={isPaused} className={`flex-1 h-20 rounded-3xl font-black text-2xl tracking-widest flex items-center justify-center gap-3 transition-all shadow-[0_0_50px_rgba(6,182,212,0.3)] ${isPaused ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' : 'bg-white text-black hover:scale-[1.02] active:scale-95'}`}>
                    <CheckCircle size={32} /> COMPLETE SET
                </button>
            </div>
        )}

        {/* Exit Modal */}
        <AnimatePresence>
            {showExitModal && (
                <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
                    <motion.div initial={{scale:0.9, opacity: 0}} animate={{scale:1, opacity: 1}} className="bg-[#101010] border border-white/10 p-8 rounded-[40px] max-w-sm w-full text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><LogOut className="text-red-500" size={32}/></div>
                        <h3 className="text-2xl font-black mb-2 text-white">ABORT SESSION?</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed text-sm">Progress for this session will be lost.</p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowExitModal(false); setIsPaused(false); }} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10">RESUME</button>
                            <button onClick={() => router.push('/')} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-500 shadow-lg shadow-red-900/20">QUIT</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Spotify Overlay */}
        <div className={`fixed bottom-32 right-6 z-[60] transition-all duration-500 ${showSpotify ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}`} style={{ width: '320px' }}>
            <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden p-4 shadow-2xl">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-green-500 flex items-center gap-2 uppercase tracking-widest"><Music size={12}/> SPOTIFY LINK</span>
                    <button onClick={() => setShowSpotify(false)} className="bg-white/10 p-1 rounded-full hover:bg-white/20"><X size={12}/></button>
                </div>
                <iframe style={{borderRadius: '16px'}} src={spotifyLink} width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
            </div>
        </div>
    </div>
  );
}