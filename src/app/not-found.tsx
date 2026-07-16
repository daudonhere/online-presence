"use client";

import { Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <span className="text-3xl font-black text-slate-400">404</span>
        </div>
        <h1 className="font-display text-xl font-bold text-slate-950">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:scale-[0.98]"
          >
            <ArrowLeft className="text-lg" />
            Kembali
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1b8659] px-5 py-3 text-sm font-black text-[#ffff00] transition hover:scale-[0.98]"
          >
            <Home className="text-lg" />
            Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
