import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Hand,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";

export default function ScanPage() {
  return (
    <DashboardLayout>
      <section className="w-full max-w-md mx-auto h-full rounded-[34px] bg-white p-4 shadow-soft ring-1 ring-slate-100 flex flex-col">
        <div className="rounded-[30px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative flex-1 flex flex-col">
          <div className="absolute -right-16 -top-10 h-44 w-44 rounded-bl-[64px] bg-[#ffff00] z-0" />
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-[#003d7a]/25" />
          <div className="absolute right-6 top-24 grid grid-cols-2 gap-1 opacity-80">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#ffff00]" />
            ))}
          </div>

          <div className="relative flex items-center justify-between gap-3">
            <Link
              href="/"
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 transition hover:bg-white/25"
              aria-label="Kembali ke halaman absensi"
            >
              <ArrowLeft className="text-xl text-white" />
            </Link>
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/15">
                <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
                Pemindai QR
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex-1 rounded-[28px] bg-slate-950/40 p-3 ring-1 ring-white/15 shadow-card flex items-center justify-center">
            <div className="relative w-full max-w-[286px] aspect-square overflow-hidden rounded-[22px] bg-gradient-to-br from-slate-900 via-[#0b3f2d] to-[#003d7a]">
              <div className="absolute inset-0 opacity-30">
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,0,0.28),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(27,134,89,0.45),transparent_34%)]" />
              </div>
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-[230px] w-[230px] animate-pulse">
                  <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-[#ffff00]" />
                  <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-[#ffff00]" />
                  <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-[#ffff00]" />
                  <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-[#ffff00]" />
                  <div className="absolute left-3 right-3 top-0 h-0.5 bg-[#ffff00] shadow-[0_0_24px_rgba(255,255,0,0.95)] animate-[scan_2.2s_ease-in-out_infinite]" />
                  <div className="absolute inset-8 flex items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10">
                    <QrCode className="text-7xl text-white/35" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-4 space-y-3">
            <a
              href="#"
              className="min-h-[58px] w-full rounded-2xl bg-[#ffff00] px-5 py-4 text-center text-base font-black text-[#003d7a] transition hover:scale-[0.98] flex items-center justify-center gap-2 shadow-card"
            >
              <CheckCircle2 className="text-2xl" />
              Kirim Absensi
            </a>
            <Link
              href="/manual"
              className="min-h-[54px] w-full rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#1b8659] transition hover:scale-[0.98] flex items-center justify-center gap-2 shadow-card"
            >
              <Hand className="text-xl" />
              Gunakan Absen Manual
            </Link>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
