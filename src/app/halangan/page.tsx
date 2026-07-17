"use client";

import {
  FileClock,
  Thermometer,
  ClipboardPen,
  CalendarDays,
  Info,
  ChevronRight,
  ListChecks,
  Loader2,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout";

const categories = [
  {
    label: "Sakit",
    description: "Ajukan izin sakit dengan surat dokter atau bukti pendukung.",
    href: "/halangan/sakit",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
    iconBg: "bg-[#1b8659]",
    iconColor: "text-[#ffff00]",
    chevronColor: "text-[#1b8659]",
    hoverBg: "hover:bg-emerald-100",
    icon: Thermometer,
  },
  {
    label: "Izin",
    description: "Ajukan izin pribadi, keluarga, atau keperluan resmi sekolah.",
    href: "/halangan/izin",
    bg: "bg-yellow-50",
    ring: "ring-yellow-100",
    iconBg: "bg-[#ffff00]",
    iconColor: "text-[#003d7a]",
    chevronColor: "text-amber-500",
    hoverBg: "hover:bg-yellow-100",
    icon: ClipboardPen,
  },
  {
    label: "Cuti",
    description: "Ajukan cuti sesuai periode dan ketentuan madrasah.",
    href: "/halangan/cuti",
    bg: "bg-blue-50",
    ring: "ring-blue-100",
    iconBg: "bg-[#003d7a]",
    iconColor: "text-[#ffff00]",
    chevronColor: "text-[#003d7a]",
    hoverBg: "hover:bg-blue-100",
    icon: CalendarDays,
  },
];

interface ObstacleRecord {
  id: number;
  userId: number;
  category: string;
  date: string;
  reason: string;
  fileUrl: string | null;
  status: string;
  createdAt: string;
  User: { id: number; name: string; phone: string };
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const CATEGORY_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  sakit: { label: "Sakit", bg: "bg-emerald-50", color: "text-[#1b8659]" },
  izin: { label: "Izin", bg: "bg-yellow-50", color: "text-amber-600" },
  cuti: { label: "Cuti", bg: "bg-blue-50", color: "text-[#003d7a]" },
};

const STATUS_STYLE: Record<string, { label: string; icon: typeof CheckCircle2; bg: string; color: string }> = {
  pending: { label: "Menunggu", icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
  approved: { label: "Disetujui", icon: CheckCircle2, bg: "bg-emerald-50", color: "text-[#1b8659]" },
  rejected: { label: "Ditolak", icon: XCircle, bg: "bg-red-50", color: "text-red-600" },
};

function getMonthOptions() {
  const now = new Date();
  const options: { month: number; year: number; label: string }[] = [];
  for (let offset = -3; offset <= 1; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    options.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]} ${y}` });
  }
  return options;
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function AdminView() {
  const monthOptions = getMonthOptions();
  const now = new Date();
  const [selected, setSelected] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const queryClient = useQueryClient();

  const { data: obstacles, isLoading } = useQuery<ObstacleRecord[]>({
    queryKey: ["admin-obstacles", selected.month, selected.year],
    queryFn: async () => {
      const res = await fetch(`/api/admin/obstacles?month=${selected.month}&year=${selected.year}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      return res.json();
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "approved" | "rejected" }) => {
      const res = await fetch(`/api/admin/obstacles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-obstacles"] });
    },
  });

  const currentIdx = monthOptions.findIndex(
    (o) => o.month === selected.month && o.year === selected.year
  );

  const items = obstacles ?? [];

  return (
    <div className="w-full max-w-md">
      <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white shadow-soft">
        <div className="absolute -right-12 -top-10 h-36 w-36 rounded-bl-[58px] bg-[#ffff00] z-0" />
        <div className="absolute -left-12 -bottom-14 h-36 w-36 rounded-full bg-[#003d7a]/25" />
        <div className="relative">
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/90 ring-1 ring-white/15">
                <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
                Admin
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold leading-none tracking-tight">
                Halangan Kehadiran
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Pantau pengajuan sakit, izin, dan cuti guru.
              </p>
            </div>
            <div className="shrink-0 h-16 w-16 rounded-[22px] bg-white flex items-center justify-center shadow-card ring-4 ring-[#ffff00]/40">
              <FileClock className="text-4xl text-[#1b8659]" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1b8659]">Periode</p>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              {MONTH_NAMES[selected.month - 1]} {selected.year}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (currentIdx > 0) setSelected({ month: monthOptions[currentIdx - 1].month, year: monthOptions[currentIdx - 1].year });
              }}
              disabled={currentIdx <= 0}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (currentIdx < monthOptions.length - 1) setSelected({ month: monthOptions[currentIdx + 1].month, year: monthOptions[currentIdx + 1].year });
              }}
              disabled={currentIdx >= monthOptions.length - 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {monthOptions.map((opt) => (
            <button
              key={`${opt.month}-${opt.year}`}
              onClick={() => setSelected({ month: opt.month, year: opt.year })}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
                selected.month === opt.month && selected.year === opt.year
                  ? "bg-[#1b8659] text-[#ffff00] shadow-card"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-slate-950">
              Pengajuan Guru
            </h2>
            <p className="text-xs text-slate-500">
              {items.length} pengajuan ditemukan
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <ListChecks className="text-2xl text-[#1b8659]" />
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[#1b8659]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FileClock className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-500">
                Tidak ada pengajuan
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Belum ada pengajuan halangan di periode ini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const cat = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.sakit;
                const sts = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
                const StatusIcon = sts.icon;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1b8659]">
                          <User className="h-5 w-5 text-[#ffff00]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-950 truncate">
                            {item.User.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDay(item.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${cat.bg} ${cat.color}`}>
                          {cat.label}
                        </span>
                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${sts.bg} ${sts.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {sts.label}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
                      {item.reason}
                    </p>
                    {item.fileUrl && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-[#1b8659]">
                        <FileText className="h-3 w-3" />
                        Ada lampiran
                      </div>
                    )}
                    {item.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => processMutation.mutate({ id: item.id, action: "approved" })}
                          disabled={processMutation.isPending}
                          className="flex-1 min-h-[40px] rounded-xl bg-[#1b8659] px-3 py-2 text-xs font-bold text-[#ffff00] transition hover:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Setujui
                        </button>
                        <button
                          onClick={() => processMutation.mutate({ id: item.id, action: "rejected" })}
                          disabled={processMutation.isPending}
                          className="flex-1 min-h-[40px] rounded-xl border-2 border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TeacherView() {
  return (
    <div className="w-full max-w-md">
      <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white shadow-soft">
        <div className="absolute -right-12 -top-10 h-36 w-36 rounded-bl-[58px] bg-[#ffff00] z-0" />
        <div className="absolute -left-12 -bottom-14 h-36 w-36 rounded-full bg-[#003d7a]/25" />
        <div className="absolute right-8 bottom-8 grid grid-cols-2 gap-1 opacity-80">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#ffff00]" />
          ))}
        </div>

        <div className="relative">
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl font-bold leading-none tracking-tight">
                Halangan Kehadiran
              </h1>
              <p className="mt-3 max-w-[230px] text-sm leading-relaxed text-white/82">
                Ajukan keterangan ketidakhadiran guru sesuai kategori dan unggah
                bukti bila diperlukan.
              </p>
            </div>
            <div className="shrink-0 h-20 w-20 rounded-[26px] bg-white flex items-center justify-center shadow-card ring-4 ring-[#ffff00]/40">
              <FileClock className="text-5xl text-[#1b8659]" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[30px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
              Pilih Kategori
            </h2>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <ListChecks className="text-2xl text-[#1b8659]" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className={`group min-h-[94px] rounded-[26px] ${cat.bg} p-4 ring-1 ${cat.ring} transition hover:scale-[0.99] ${cat.hoverBg} flex items-center gap-4`}
              >
                <div
                  className={`h-14 w-14 rounded-2xl ${cat.iconBg} flex items-center justify-center shadow-card`}
                >
                  <Icon className={`text-3xl ${cat.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold tracking-tight text-slate-950">
                    {cat.label}
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-slate-500">
                    {cat.description}
                  </p>
                </div>
                <ChevronRight
                  className={`text-2xl ${cat.chevronColor} transition group-hover:translate-x-0.5`}
                />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-4 rounded-[28px] bg-[#1b8659] p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Info className="text-2xl text-[#ffff00]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold tracking-tight text-white">
              Catatan Pengajuan
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-white/80">
              Pengajuan akan diverifikasi oleh admin madrasah sebelum masuk ke
              laporan absensi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HalanganPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <DashboardLayout>
      {isAdmin ? <AdminView /> : <TeacherView />}
    </DashboardLayout>
  );
}
