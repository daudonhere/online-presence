"use client";

import { Bell, Clock } from "lucide-react";

interface HeaderProps {
  greeting?: string;
  userName?: string;
  currentTime?: string;
  onNotificationClick?: () => void;
}

export function Header({
  greeting = "Selamat Pagi",
  userName = "Ibu Titin",
  currentTime = "07:15",
  onNotificationClick,
}: HeaderProps) {
  return (
    <header className="shrink-0 sticky top-0 z-40 pt-14 bg-gradient-to-br from-[#1b8659] via-[#12764d] to-[#075d3d] text-white overflow-hidden">
      <div className="relative px-5 pb-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
              MTS AL-RIYADL
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">
              {greeting}, {userName}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white/90">
              <Clock className="text-lg text-[#ffff00]" />
              <span>{currentTime}</span>
            </div>
          </div>
          <button
            onClick={onNotificationClick}
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 transition hover:bg-white/25"
            aria-label="Notifikasi"
          >
            <Bell className="text-xl text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
