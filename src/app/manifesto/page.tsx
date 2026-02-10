"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ChevronLeft, Terminal, Cpu, Zap, Globe,
    Github, Instagram, Linkedin, Code
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ManifestoPage() {
    const router = useRouter();
    const { t, lang } = useLanguage();

    // 📸 ضع رابط صورتك هنا
    // تأكد من وضع الصورة في مجلد public
    const MY_IMAGE = "/me.jpg";

    // 🔗 ضع روابط حساباتك هنا
    const SOCIALS = [
        { icon: Instagram, link: "https://www.instagram.com/wb6ya/", label: "Twitter" },
        { icon: Github, link: "https://github.com/wb6ya", label: "GitHub" },
        { icon: Linkedin, link: "https://www.linkedin.com/in/abdulaziz-bafarag-2926a62a6/", label: "LinkedIn" },
        //{ icon: Globe, link: "https://yourwebsite.com", label: "Website" },
    ];

    // 🛠️ التقنيات التي تتقنها
    const STACK = ["Node.js", "MongoDB", "Express", "TypeScript", "Nest.js", "React"];

    // Animation Variants
    // Animation Variants
    const containerVar = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
    } as const;

    const itemVar = {
        hidden: { y: 30, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
    } as const;

    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans overflow-y-hidden selection:bg-cyan-500/30 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* 🌌 Background FX */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
            <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-cyan-900/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="fixed top-0 w-full p-6 z-50 flex justify-between items-center bg-gradient-to-b from-black to-transparent">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 hover:border-white/20">
                    <ChevronLeft size={16} className={`group-hover:-translate-x-1 transition-transform ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">{t.dev_back}</span>
                </button>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto pt-32 px-6">
                <motion.div
                    variants={containerVar} initial="hidden" animate="show"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-12"
                >

                    {/* 🖼️ LEFT: Visual Identity (Image) */}
                    <div className="lg:col-span-5 flex flex-col items-center lg:items-start">
                        <motion.div variants={itemVar} className="relative group w-full max-w-md mx-auto lg:mx-0">
                            {/* Frame & Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 via-purple-500 to-cyan-500 rounded-[40px] blur opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />

                            <div className="relative aspect-[4/5] bg-[#0A0A0A] rounded-[38px] overflow-hidden border border-white/10 shadow-2xl">
                                {/* Image */}
                                <div className="absolute inset-0">
                                    <img src={MY_IMAGE} alt="Developer" className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                </div>

                                {/* Overlay Text */}
                                <div className="absolute bottom-0 left-0 w-full p-8">
                                    <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] uppercase tracking-[0.2em] mb-2">
                                        <Terminal size={12} /> {t.dev_role}
                                    </div>
                                    <h1 className="text-4xl lg:text-5xl font-black text-white leading-none tracking-tight mb-4">{t.dev_name}</h1>

                                    {/* Tech Badges */}
                                    <div className="flex flex-wrap gap-2">
                                        {STACK.slice(0, 3).map((tech) => (
                                            <span key={tech} className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-gray-300">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Social Links (Desktop Layout) */}
                        <motion.div variants={itemVar} className="hidden lg:flex gap-4 mt-8">
                            {SOCIALS.map((social, i) => (
                                <a key={i} href={social.link} target="_blank" className="w-14 h-14 bg-[#151515] border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 hover:scale-110 transition-all group/icon" title={social.label}>
                                    <social.icon size={24} className="group-hover/icon:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                                </a>
                            ))}
                        </motion.div>
                    </div>

                    {/* 📝 RIGHT: Bio & Vision */}
                    <div className="lg:col-span-7 space-y-12 flex flex-col justify-center">

                        {/* Quote */}
                        <motion.div variants={itemVar} className="relative">
                            <div className="absolute -left-6 top-0 text-6xl text-white/5 font-serif font-black">“</div>
                            <h2 className="text-2xl md:text-3xl font-light text-white leading-relaxed italic opacity-90">
                                {t.dev_quote}
                            </h2>
                        </motion.div>

                        {/* Bio Section */}
                        <motion.div variants={itemVar} className="space-y-4">
                            <div className="flex items-center gap-2 text-cyan-500 text-xs font-bold uppercase tracking-widest">
                                <Cpu size={14} /> {t.dev_bio_title}
                            </div>
                            <p className="text-gray-400 leading-loose text-sm md:text-base border-l-2 border-white/10 pl-6">
                                {t.dev_bio_body}
                            </p>
                        </motion.div>

                        {/* Vision Section */}
                        <motion.div variants={itemVar} className="space-y-4">
                            <div className="flex items-center gap-2 text-purple-500 text-xs font-bold uppercase tracking-widest">
                                <Zap size={14} /> {t.dev_vision_title}
                            </div>
                            <p className="text-gray-400 leading-loose text-sm md:text-base border-l-2 border-white/10 pl-6">
                                {t.dev_vision_body}
                            </p>
                        </motion.div>

                        {/* Stack Grid */}
                        <motion.div variants={itemVar}>
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">
                                <Code size={14} /> {t.dev_stack_title}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {STACK.map((tech, i) => (
                                    <div key={i} className="bg-[#0A0A0A] border border-white/5 p-4 rounded-xl flex items-center gap-3 hover:border-cyan-500/20 transition-colors group/stack">
                                        <div className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover/stack:bg-cyan-500 transition-colors" />
                                        <span className="text-sm font-bold text-gray-300 group-hover/stack:text-white transition-colors">{tech}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Mobile Socials */}
                        <motion.div variants={itemVar} className="lg:hidden">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">
                                <Globe size={14} /> {t.dev_connect}
                            </div>
                            <div className="flex gap-4 overflow-x-auto pb-4">
                                {SOCIALS.map((social, i) => (
                                    <a key={i} href={social.link} target="_blank" className="w-14 h-14 bg-[#151515] border border-white/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all">
                                        <social.icon size={24} />
                                    </a>
                                ))}
                            </div>
                        </motion.div>

                    </div>
                </motion.div>
            </div >
        </div >
    );
}