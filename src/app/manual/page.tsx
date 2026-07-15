"use client";

import {
  ArrowLeft,
  Calendar,
  Clock,
  NotebookPen,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout";

export default function ManualPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <DashboardLayout>
      <div className="w-full max-w-md">
      <div className="rounded-[30px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative">
        <div className="absolute -right-12 -top-8 h-32 w-32 rounded-bl-[46px] bg-[#ffff00] z-0" />
        <div className="absolute -left-8 -bottom-10 h-28 w-28 rounded-full bg-[#003d7a]/25" />
        <div className="relative flex items-start gap-4">
          <Link
            href="/"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 transition hover:bg-white/25"
            aria-label="Kembali ke halaman absensi"
          >
            <ArrowLeft className="text-xl text-white" />
          </Link>
          <div className="pt-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/90 ring-1 ring-white/15">
              <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
              Hari Ini
            </div>
            <h2 className="mt-3 font-display text-lg font-bold tracking-tight">
              Rabu, 24 Juli 2026
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Isi data kedatangan hari ini.
            </p>
          </div>
        </div>
      </div>

      <form
        className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="attendance-date"
              className="flex items-center gap-2 text-sm font-bold text-slate-900"
            >
              <Calendar className="text-lg text-[#1b8659]" />
              Tanggal Absensi
            </label>
            <div className="mt-2 relative">
              <input
                id="attendance-date"
                name="attendance-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <Calendar className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400" />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Pastikan tanggal sesuai hari kerja aktif.
            </p>
          </div>

          <div>
            <label
              htmlFor="arrival-time"
              className="flex items-center gap-2 text-sm font-bold text-slate-900"
            >
              <Clock className="text-lg text-[#1b8659]" />
              Jam Kedatangan
            </label>
            <div className="mt-2 relative">
              <input
                id="arrival-time"
                name="arrival-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <Clock className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-400" />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Jam akan digunakan sebagai bukti waktu absen masuk.
            </p>
          </div>

          <div>
            <label
              htmlFor="attendance-notes"
              className="flex items-center gap-2 text-sm font-bold text-slate-900"
            >
              <NotebookPen className="text-lg text-[#1b8659]" />
              Catatan Opsional
            </label>
            <textarea
              id="attendance-notes"
              name="attendance-notes"
              rows={4}
              placeholder="Contoh: Hadir untuk jadwal piket pagi dan mengajar kelas VII A."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-[#ffff00] p-4 text-[#003d7a]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-9 w-9 shrink-0 rounded-2xl bg-[#003d7a] flex items-center justify-center text-[#ffff00]">
              <Send className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-black">Verifikasi Kehadiran</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#003d7a]/80">
                Dengan menekan tombol kirim, data absensi akan tersimpan untuk
                rekap kehadiran guru MTS AL-RIYADL.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 min-h-[58px] w-full rounded-2xl bg-[#1b8659] px-5 py-4 text-center text-base font-black text-[#ffff00] shadow-card transition hover:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Send className="text-2xl" />
          Kirim Absensi
        </button>
      </form>

      <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Status Terakhir
            </p>
            <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-950">
              Belum absen masuk
            </h3>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-600">
            Menunggu
          </span>
        </div>
      </section>
      </div>
    </DashboardLayout>
  );
}
