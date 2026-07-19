"use client";

import {
  FileClock,
  Thermometer,
  ClipboardPen,
  CalendarDays,
  Info,
  ListChecks,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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

function AdminView() {
  const adminMenus = [
    {
      label: "Persetujuan",
      description: "Review dan proses pengajuan halangan dari guru.",
      href: "/halangan/admin/persetujuan",
      bg: "bg-amber-50",
      ring: "ring-amber-100",
      iconBg: "bg-amber-500",
      iconColor: "text-white",
      chevronColor: "text-amber-500",
      hoverBg: "hover:bg-amber-100",
      icon: Clock,
    },
    {
      label: "Riwayat",
      description: "Lihat pengajuan yang sudah disetujui atau ditolak.",
      href: "/halangan/admin/riwayat",
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
      iconBg: "bg-[#1b8659]",
      iconColor: "text-[#ffff00]",
      chevronColor: "text-[#1b8659]",
      hoverBg: "hover:bg-emerald-100",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="w-full max-w-md">
      <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white shadow-soft">
        <div className="absolute -right-12 -top-10 h-36 w-36 rounded-bl-[58px] bg-[#ffff00] z-0" />
        <div className="absolute -left-12 -bottom-14 h-36 w-36 rounded-full bg-[#003d7a]/25" />
        <div className="relative">
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <h1 className="mt-3 font-display text-3xl font-bold leading-none tracking-tight">
                Halangan Kehadiran
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Kelola pengajuan sakit, izin, dan cuti guru.
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
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              Menu
            </h2>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <ListChecks className="text-2xl text-[#1b8659]" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {adminMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <Link
                key={menu.label}
                href={menu.href}
                className={`group min-h-[94px] rounded-[26px] ${menu.bg} p-4 ring-1 ${menu.ring} transition hover:scale-[0.99] ${menu.hoverBg} flex items-center gap-4`}
              >
                <div
                  className={`h-14 w-14 rounded-2xl ${menu.iconBg} flex items-center justify-center shadow-card`}
                >
                  <Icon className={`text-3xl ${menu.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold tracking-tight text-slate-950">
                    {menu.label}
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-slate-500">
                    {menu.description}
                  </p>
                </div>
                <ChevronRight
                  className={`text-2xl ${menu.chevronColor} transition group-hover:translate-x-0.5`}
                />
              </Link>
            );
          })}
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
