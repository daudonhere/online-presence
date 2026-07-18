"use client";

import { Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { NotificationBell } from "@/components/ui/NotificationBell";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function Header() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Guru";

  return (
    <header className="shrink-0 sticky top-0 z-40 pt-11 bg-gradient-to-br from-[#1b8659] via-[#12764d] to-[#075d3d] text-white overflow-hidden rounded-b-3xl">
      <div className="relative px-5 pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffff00]" />
              MTS AL-RIYADL
            </div>
            <h1 className="mt-1 font-display text-lg font-bold tracking-tight truncate">
              {getGreeting()}, {userName}
            </h1>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/90">
              <Clock className="text-sm text-[#ffff00]" />
              <span>{getCurrentTime()}</span>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
