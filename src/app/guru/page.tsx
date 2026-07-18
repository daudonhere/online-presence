"use client";

import {
  ArrowLeft,
  Search,
  Users,
  Loader2,
  ChevronRight,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Teacher {
  id: number;
  name: string;
  phone: string;
  subject: string;
  nip: string;
  avatarUrl: string;
  todayStatus: string | null;
}

const statusColors: Record<string, string> = {
  hadir: "bg-emerald-100 text-emerald-700",
  izin: "bg-yellow-100 text-amber-700",
  sakit: "bg-red-100 text-red-700",
  alpha: "bg-slate-100 text-slate-600",
};

const statusLabels: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpha: "Alpha",
};

export default function GuruListPage() {
  const [search, setSearch] = useState("");

  const { data: teachers, isLoading } = useQuery<Teacher[]>({
    queryKey: ["admin", "teachers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/teachers");
      if (!res.ok) throw new Error("Gagal memuat data guru");
      return res.json();
    },
  });

  const filtered = (teachers || []).filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.nip.includes(search) ||
      t.phone.includes(search)
  );

  return (
    <DashboardLayout>
      <section className="w-full max-w-md mx-auto">
        <div className="rounded-[32px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative shadow-soft">
          <div className="absolute -right-12 -top-8 h-32 w-32 rounded-bl-[52px] bg-[#ffff00] z-0" />
          <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[#003d7a]/25" />

          <div className="relative flex items-center gap-3">
            <Link
              href="/pengaturan"
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/15 flex items-center justify-center ring-1 ring-white/20 transition hover:bg-white/25"
            >
              <ArrowLeft className="text-xl text-white" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/90 ring-1 ring-white/15">
                <span className="h-2 w-2 rounded-full bg-[#ffff00]" />
                Manajemen Guru
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">
                Daftar Guru
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {teachers ? `${teachers.length} guru terdaftar` : "Memuat..."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[28px] bg-white p-3 shadow-card ring-1 ring-slate-100">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
            <Search className="text-lg text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari nama, NIP, atau telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-[#1b8659]" />
              <p className="text-sm font-semibold">Memuat data guru...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
              <Users className="h-10 w-10" />
              <p className="text-sm font-semibold">Tidak ada guru ditemukan</p>
            </div>
          ) : (
            filtered.map((teacher) => (
              <Link
                key={teacher.id}
                href={`/guru/${teacher.id}`}
                className="block rounded-[24px] bg-white p-4 shadow-card ring-1 ring-slate-100 transition hover:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#1b8659] to-[#0c6b46] flex items-center justify-center">
                    {teacher.avatarUrl ? (
                      <img
                        src={teacher.avatarUrl}
                        alt={teacher.name}
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <UserRound className="text-xl text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-950 truncate">
                      {teacher.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {teacher.subject || "Belum diatur"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {teacher.todayStatus && (
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColors[teacher.todayStatus] || "bg-slate-100 text-slate-500"}`}>
                        {statusLabels[teacher.todayStatus] || teacher.todayStatus}
                      </span>
                    )}
                    <ChevronRight className="text-lg text-slate-300" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
