"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QrCode, FileClock, BarChart3, FileDown, UserCog } from "lucide-react";

const navItems = [
  { href: "/", label: "Absensi", icon: QrCode },
  { href: "/halangan", label: "Halangan", icon: FileClock },
  { href: "/analisa", label: "Analisa", icon: BarChart3 },
  { href: "/laporan", label: "Laporan", icon: FileDown },
  { href: "/pengaturan", label: "Atur", icon: UserCog },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <footer className="shrink-0 fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-[34px] rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <nav className="grid grid-cols-5 px-2 pt-1.5" aria-label="Navigasi utama">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/" || pathname === "/scan" || pathname === "/manual"
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-[44px] rounded-2xl flex flex-col items-center justify-center gap-0.5 ${
                isActive
                  ? "bg-[#1b8659] text-[#ffff00]"
                  : "text-slate-400 transition hover:text-[#1b8659]"
              }`}
            >
              <Icon className="text-lg" />
              <span
                className={`text-[10px] ${
                  isActive ? "font-bold" : "font-semibold"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
