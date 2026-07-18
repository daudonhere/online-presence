"use client";

import {
  BarChart3,
  ClipboardPen,
  CircleAlert,
  CalendarRange,
  FileDown,
  ArrowRight,
  Loader2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { queryKeys } from "@/lib/query-keys";

interface AnalysisData {
  month: number;
  year: number;
  totalTeachers: number;
  todayHadir: number;
  todayIzin: number;
  todaySakit: number;
  tidakHadirHari: number;
  dailyChart: { day: number; hadir: number }[];
  weeks: {
    week: string;
    date: string;
    days: { day: string; date: number; hadir: number; isToday: boolean }[];
  }[];
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function AnalisaPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data, isLoading } = useQuery<AnalysisData>({
    queryKey: queryKeys.analysis(month, year),
    queryFn: async () => {
      const res = await fetch(`/api/attendance/analysis?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Gagal memuat data analisa");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <section className="w-full max-w-md mx-auto flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-[#1b8659]" />
        </section>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <section className="w-full max-w-md mx-auto flex items-center justify-center min-h-[60vh]" />
      </DashboardLayout>
    );
  }

  const monthName = MONTH_NAMES[data.month - 1];
  const barChart = data.dailyChart;
  const lastDay = barChart.length;
  const maxHadir = Math.max(...barChart.map((d) => d.hadir), 1);

  return (
    <DashboardLayout>
      <section className="w-full max-w-md mx-auto">
        <div className="rounded-[32px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative shadow-soft">
          <div className="absolute -right-12 -top-8 h-32 w-32 rounded-bl-[52px] bg-[#ffff00] z-0" />
          <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[#003d7a]/25" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/15">
                <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
                {monthName} {data.year}
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
                Analisa Kehadiran
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {isAdmin ? "Rekap kehadiran guru selama bulan berjalan." : "Ringkasan kehadiran Anda selama bulan berjalan."}
              </p>
            </div>
            <div className="relative h-16 w-16 shrink-0 rounded-3xl bg-white flex items-center justify-center shadow-card ring-4 ring-[#ffff00]/40">
              <BarChart3 className="text-3xl text-[#1b8659]" />
            </div>
          </div>

          <div className="relative mt-6 rounded-[28px] bg-white/12 p-4 ring-1 ring-white/15">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-white/70">
                  Guru Hadir Hari Ini
                </p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="font-display text-5xl font-bold leading-none tracking-tight">
                    {data.todayHadir}
                  </span>
                  {isAdmin && (
                    <span className="pb-1 text-sm font-semibold text-white/60">
                      dari {data.totalTeachers} guru
                    </span>
                  )}
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-[#ffff00] flex items-center justify-center text-[#003d7a]">
                <Users className="text-3xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <article className="rounded-[24px] bg-white p-4 text-center shadow-card ring-1 ring-slate-100">
            <div className="mx-auto h-11 w-11 rounded-2xl bg-red-50 flex items-center justify-center">
              <CircleAlert className="text-2xl text-red-400" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-red-400">
              {data.todaySakit}
            </p>
            <p className="text-xs font-semibold text-slate-500">Sakit Hari Ini</p>
          </article>
          <article className="rounded-[24px] bg-white p-4 text-center shadow-card ring-1 ring-slate-100">
            <div className="mx-auto h-11 w-11 rounded-2xl bg-yellow-50 flex items-center justify-center">
              <ClipboardPen className="text-2xl text-amber-500" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-amber-500">
              {data.todayIzin}
            </p>
            <p className="text-xs font-semibold text-slate-500">Izin Hari Ini</p>
          </article>
          <article className="rounded-[24px] bg-white p-4 text-center shadow-card ring-1 ring-slate-100">
            <div className="mx-auto h-11 w-11 rounded-2xl bg-red-50 flex items-center justify-center">
              <CircleAlert className="text-2xl text-red-400" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight text-red-400">
              {data.tidakHadirHari}
            </p>
            <p className="text-xs font-semibold text-slate-500">Tidak Hadir</p>
          </article>
        </div>

        <section className="mt-4 rounded-[30px] bg-white p-5 shadow-card ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                Grafik Harian
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jumlah guru hadir per hari
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[26px] bg-slate-50 p-4">
            <svg
              viewBox="0 0 310 120"
              className="w-full h-40"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1b8659" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1b8659" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {(() => {
                const w = 310;
                const h = 120;
                const padding = 4;
                const vals = barChart.map((d) => d.hadir);
                const points = vals.map((val, i) => {
                  const x = padding + (i / (vals.length - 1)) * (w - padding * 2);
                  const y = h - padding - (val / maxHadir) * (h - padding * 2);
                  return { x, y };
                });
                const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
                const areaD = lineD + ` L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;
                return (
                  <>
                    <path d={areaD} fill="url(#lineGrad)" />
                    <path d={lineD} fill="none" stroke="#1b8659" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {points.filter((_, i) => i % 7 === 0 || i === points.length - 1).map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="3" fill="#1b8659" />
                    ))}
                  </>
                );
              })()}
            </svg>
            <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>1</span>
              <span>7</span>
              <span>14</span>
              <span>21</span>
              <span>28</span>
              <span>{lastDay}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="h-3 w-3 rounded-full bg-[#1b8659]" />
              Jumlah Hadir
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[30px] bg-white p-5 shadow-card ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                Rincian Mingguan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Total guru hadir setiap hari
              </p>
            </div>
            <CalendarRange className="text-2xl text-[#1b8659]" />
          </div>

          <div className="mt-5 space-y-3">
            {data.weeks.map((week) => (
              <article
                key={week.week}
                className="rounded-[24px] bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-950">{week.week}</h3>
                    <p className="text-xs text-slate-500">{week.date}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-6 gap-2 text-center">
                  {week.days.map((day) => {
                    const isToday = day.isToday;
                    const isFuture = day.date > now.getDate();
                    return (
                      <div
                        key={day.date}
                        className={`rounded-2xl px-1 py-2 ${
                          isToday
                            ? "bg-[#ffff00] ring-2 ring-[#1b8659] text-[#003d7a]"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <p className="text-[11px] font-bold">{day.day}</p>
                        <p className="text-[10px]">{day.date}</p>
                        <p className="mt-0.5 text-[10px] font-bold">
                          {day.hadir > 0 ? `${day.hadir} hadir` : isFuture ? "-" : "0"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-[30px] bg-[#003d7a] p-5 text-white shadow-card overflow-hidden relative">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ffff00]/20" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#ffff00] flex items-center justify-center text-[#003d7a]">
              <FileDown className="text-2xl" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold tracking-tight">
                Butuh laporan lengkap?
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Unduh rekap absensi berdasarkan periode.
              </p>
            </div>
          </div>
          <Link
            href="/laporan"
            className="relative mt-4 min-h-[50px] w-full rounded-2xl bg-white px-4 py-3 flex items-center justify-center gap-2 text-sm font-black text-[#003d7a] transition hover:scale-[0.98]"
          >
            Buka Laporan
            <ArrowRight className="text-lg" />
          </Link>
        </section>
      </section>
    </DashboardLayout>
  );
}
