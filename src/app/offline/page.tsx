"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-[30px] bg-white p-8 shadow-soft ring-1 ring-slate-100 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] shadow-card">
          <WifiOff className="h-10 w-10 text-[#ffff00]" />
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-slate-950">
          Tidak Ada Koneksi
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Silakan periksa koneksi internet Anda, lalu muat ulang halaman ini.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 min-h-[54px] w-full rounded-2xl bg-[#1b8659] px-5 py-3 text-sm font-black text-[#ffff00] shadow-card transition hover:scale-[0.98]"
        >
          Muat Ulang
        </button>

        <p className="mt-4 text-xs font-medium text-slate-400">
          Absensi Al-Riyadl &middot; MTS AL-RIYADL
        </p>
      </div>
    </div>
  );
}
