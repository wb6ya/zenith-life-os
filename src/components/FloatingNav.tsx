"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function FloatingNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // 🛑 شرط الإخفاء: إذا كنا في صفحة المشغل، لا ترجع شيئاً (Null)
  if (pathname === '/fitness/player' || pathname === '/login' || pathname === '/register') return null;
  // تحديد الصفحة النشطة
  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  const navItems = [
    { name: t.nav_home, path: "/", icon: <Home size={24} /> },
    { name: t.nav_fitness, path: "/fitness", icon: <Dumbbell size={24} /> },
    { name: t.nav_profile, path: "/profile", icon: <User size={24} /> },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[90%]" dir="ltr">
      
      {/* Container */}
      <div className="flex items-center gap-2 p-2 bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50">
        
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`
                flex items-center justify-center gap-3 rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${active 
                  ? "bg-white text-black py-3 px-6"  
                  : "text-gray-400 hover:text-white hover:bg-white/10 py-3 px-3 aspect-square"
                }
              `}
            >
              {/* Icon */}
              <span className={active ? "scale-110 transition-transform" : ""}>
                {item.icon}
              </span>

              {/* Text */}
              <span className={`text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-500 ${active ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"}`}>
                {active && item.name}
              </span>
            </Link>
          );
        })}

      </div>
    </div>
  );
}