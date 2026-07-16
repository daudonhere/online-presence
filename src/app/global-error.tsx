"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="text-3xl text-red-500" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-950">
            Terjadi Kesalahan
          </h1>
          <p className="text-sm text-slate-500">
            {error.message || "Aplikasi mengalami gangguan yang tidak terduga."}
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#1b8659] px-6 py-3 text-sm font-black text-[#ffff00] transition hover:scale-[0.98]"
          >
            <RefreshCcw className="text-lg" />
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
