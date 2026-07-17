"use client";

import {
  FileClock,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Loader2,
  Search,
  ChevronLeft,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout";

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

const CATEGORY_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  sakit: { label: "Sakit", bg: "bg-emerald-50", color: "text-[#1b8659]" },
  izin: { label: "Izin", bg: "bg-yellow-50", color: "text-amber-600" },
  cuti: { label: "Cuti", bg: "bg-blue-50", color: "text-[#003d7a]" },
};

const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Agu" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Okt" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Des" },
];

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const YEAR_LIST = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 3 + i);

function formatDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

async function downloadFile(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = url.split(".").pop()?.split("?")[0] || "file";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `lampiran.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function PersetujuanPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: obstacles, isLoading } = useQuery<ObstacleRecord[]>({
    queryKey: ["admin-obstacles", month, year],
    queryFn: async () => {
      const res = await fetch(`/api/admin/obstacles?month=${month}&year=${year}`);
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

  const items = (obstacles ?? []).filter((i) => i.status === "pending");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.User.name.toLowerCase().includes(q) || i.User.phone.includes(q)
    );
  }, [items, search]);

  return (
    <DashboardLayout>
      <div className="w-full max-w-md">
        <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white shadow-soft">
          <div className="absolute -right-12 -top-10 h-36 w-36 rounded-bl-[58px] bg-[#ffff00] z-0" />
          <div className="absolute -left-12 -bottom-14 h-36 w-36 rounded-full bg-[#003d7a]/25" />
          <div className="relative">
            <Link
              href="/halangan"
              className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/90 ring-1 ring-white/15 transition hover:bg-white/25"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Kembali
            </Link>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold leading-none tracking-tight">
                  Persetujuan
                </h1>
                <p className="mt-2 text-sm text-white/80">
                  {items.length} pengajuan menunggu persetujuan
                </p>
              </div>
              <div className="shrink-0 h-16 w-16 rounded-[22px] bg-white flex items-center justify-center shadow-card ring-4 ring-[#ffff00]/40">
                <Clock className="text-4xl text-amber-500" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1b8659]">Periode</p>
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
                {MONTH_NAMES[month - 1]} {year}
              </h2>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CalendarDays className="text-2xl text-[#1b8659]" />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Bulan</span>
              <div className="mt-2 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {MONTHS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMonth(m.value)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                      month === m.value
                        ? "bg-[#1b8659] text-[#ffff00] shadow-card"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Tahun</span>
              <div className="mt-2 flex justify-center gap-2">
                {YEAR_LIST.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                      year === y
                        ? "bg-[#1b8659] text-[#ffff00] shadow-card"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau nomor HP..."
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 transition focus:border-[#1b8659] focus:outline-none focus:ring-4 focus:ring-[#1b8659]/10"
            />
          </div>
        </section>

        {isLoading ? (
          <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[#1b8659]" />
            </div>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FileClock className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-500">
                {search.trim() ? "Tidak ditemukan" : "Tidak ada pengajuan"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {search.trim() ? "Coba kata kunci lain" : "Semua pengajuan sudah diproses"}
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-4 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
            <p className="text-xs font-bold text-slate-400">
              {filtered.length} pengajuan
            </p>
            <div className="mt-3 space-y-3">
              {filtered.map((item) => {
                const cat = CATEGORY_BADGE[item.category] ?? CATEGORY_BADGE.sakit;
                return (
                  <div key={item.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
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
                            {formatDay(item.date)} · {item.User.phone}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${cat.bg} ${cat.color}`}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
                      {item.reason}
                    </p>
                    {item.fileUrl && (
                      <button
                        onClick={() => downloadFile(item.fileUrl!)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1b8659]/10 px-3 py-1.5 text-[11px] font-bold text-[#1b8659] transition hover:bg-[#1b8659]/20"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Unduh Lampiran
                      </button>
                    )}
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
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
