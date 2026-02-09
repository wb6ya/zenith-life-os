"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Mail, ArrowRight, Github, Globe, AlertCircle, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. إنشاء الحساب (API)
      const res = await fetch("/api/signup", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || (lang === 'ar' ? "فشل التسجيل" : "Registration failed"));
      }

      // 2. الدخول التلقائي (Auto Login)
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (loginRes?.error) {
        // حالة نادرة: تم التسجيل لكن فشل الدخول
        router.push("/login");
      } else {
        // ✅ نجاح كامل
        router.push("/");
        router.refresh();
      }

    } catch (err: any) {
        setError(err.message || (lang === 'ar' ? "حدث خطأ ما" : "Something went wrong"));
        setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
      setLoading(true);
      signIn(provider, { callbackUrl: '/' });
  };

  const isAr = lang === 'ar';

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden" dir="ltr">
      
      {/* زر اللغة */}
      <button 
        onClick={() => setLang(isAr ? 'en' : 'ar')}
        className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all text-xs font-bold backdrop-blur-md hover:scale-105 active:scale-95"
      >
        <Globe size={14} /> {isAr ? "English" : "عربي"}
      </button>

      {/* الخلفية */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{animationDelay: '1s'}}></div>

      <div className="w-full max-w-md bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        <div className="text-center mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">ZENITH <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 animate-pulse">OS</span></h1>
            <p className="text-gray-400 text-sm">{isAr ? "انضم للنخبة وأنشئ حسابك" : "Join the elite. Create account."}</p>
        </div>

        {/* أزرار السوشيال */}
        <div className="flex gap-3 mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100 fill-mode-both">
            <button onClick={() => handleSocialLogin('google')} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 group">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.065 0 12 0 7.37 0 3.376 2.67 1.453 6.653l3.813 3.112z"/><path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-3.815 3.054C3.292 21.415 7.274 24 12 24c3.2 0 5.845-1.158 7.828-3.04l-3.788-2.947z"/><path fill="#4A90E2" d="M19.828 20.96a12.004 12.004 0 0 0 2.614-7.29c0-.667-.062-1.41-.176-2.072H12v4.56h6.078a5.22 5.22 0 0 1-2.25 3.39l3.789 2.946z"/><path fill="#FBBC05" d="M12 4.909c-1.66 0-3.088.948-3.803 2.37l-3.812-3.111C6.273 1.54 8.937 0 12 0v4.909z"/></svg>
                <span className="text-sm font-bold text-gray-300">Google</span>
            </button>
            <button onClick={() => handleSocialLogin('github')} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 group">
                <Github size={20} className="text-white group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-gray-300">GitHub</span>
            </button>
        </div>

        <div className="flex items-center gap-3 mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100 fill-mode-both">
            <div className="h-[1px] bg-white/10 flex-1"></div>
            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{isAr ? "أو بالإيميل" : "OR EMAIL"}</span>
            <div className="h-[1px] bg-white/10 flex-1"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200 fill-mode-both" autoComplete="off">
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in zoom-in slide-in-from-top-2 duration-300">
                    <AlertCircle size={18} className="animate-bounce" /> {error}
                </div>
            )}
            
            {/* Input Hack to prevent auto-fill background color mess */}
            <input type="text" style={{display: 'none'}} />
            <input type="password" style={{display: 'none'}} />

            {/* Name Field - New */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 px-1 ml-1">{isAr ? "الاسم الكامل" : "Full Name"}</label>
                <div className="relative group">
                    <input 
                        type="text" 
                        required
                        autoComplete="off"
                        className="w-full bg-black/40 border border-white/10 group-hover:border-white/20 rounded-2xl p-4 pr-12 text-white outline-none focus:border-blue-500 focus:bg-black/60 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all placeholder:text-gray-700"
                        placeholder={isAr ? "الاسم..." : "Your name..."}
                        value={data.name}
                        onChange={(e) => setData({...data, name: e.target.value})}
                    />
                    <User className="absolute top-4 right-4 text-gray-500 group-focus-within:text-blue-500 group-focus-within:scale-110 transition-all duration-300" size={20} />
                </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 px-1 ml-1">{isAr ? "البريد الإلكتروني" : "Email Address"}</label>
                <div className="relative group">
                    <input 
                        type="email" 
                        required
                        autoComplete="off"
                        name="email_new"
                        className="w-full bg-black/40 border border-white/10 group-hover:border-white/20 rounded-2xl p-4 pr-12 text-white outline-none focus:border-blue-500 focus:bg-black/60 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all placeholder:text-gray-700"
                        placeholder="name@example.com"
                        value={data.email}
                        onChange={(e) => setData({...data, email: e.target.value})}
                    />
                    <Mail className="absolute top-4 right-4 text-gray-500 group-focus-within:text-blue-500 group-focus-within:scale-110 transition-all duration-300" size={20} />
                </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 px-1 ml-1">{isAr ? "كلمة المرور" : "Password"}</label>
                <div className="relative group">
                    <input 
                        type="password" 
                        required
                        autoComplete="new-password"
                        name="password_new"
                        className="w-full bg-black/40 border border-white/10 group-hover:border-white/20 rounded-2xl p-4 pr-12 text-white outline-none focus:border-blue-500 focus:bg-black/60 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all placeholder:text-gray-700"
                        placeholder="••••••••"
                        value={data.password}
                        onChange={(e) => setData({...data, password: e.target.value})}
                    />
                    <Lock className="absolute top-4 right-4 text-gray-500 group-focus-within:text-blue-500 group-focus-within:scale-110 transition-all duration-300" size={20} />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 hover:scale-[1.02] active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-900/20 mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
                {loading ? <Loader2 className="animate-spin" /> : <>{isAr ? "إنشاء الحساب" : "Sign Up"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-8 animate-in fade-in duration-1000 delay-300 fill-mode-both">
            {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"} <Link href="/login" className="text-blue-500 hover:underline font-bold decoration-blue-500 underline-offset-4 hover:text-blue-400 transition-colors">{isAr ? "تسجيل دخول" : "Login"}</Link>
        </p>
      </div>
    </div>
  );
}