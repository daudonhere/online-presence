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
    <header className="shrink-0 sticky top-0 z-40 pt-14 bg-gradient-to-br from-[#1b8659] via-[#12764d] to-[#075d3d] text-white overflow-hidden">
      <div className="relative px-5 pb-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
              MTS AL-RIYADL
            </div>
            <h1 className="mt-2 font-display text-xl font-bold tracking-tight truncate">
              {getGreeting()}, {userName}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white/90">
              <Clock className="text-lg text-[#ffff00]" />
              <span>{getCurrentTime()}</span>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
