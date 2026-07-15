import {
  FileDown,
  CalendarDays,
  Search,
  FileText,
  UserCheck,
  ClipboardList,
  Check,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";

const reports = [
  {
    title: "Rekap Absensi Guru Juli 2026",
    period: "Periode 01 - 31 Juli 2026",
    icon: FileText,
    iconBg: "bg-[#1b8659]",
    iconColor: "text-[#ffff00]",
    stats: [
      { label: "Hari Kerja", value: "23 hari", color: "text-slate-950", bg: "bg-slate-50" },
      { label: "Dibuat", value: "15 Jul 2026", color: "text-slate-950", bg: "bg-slate-50" },
    ],
    statsLayout: "grid-cols-2",
  },
  {
    title: "Ringkasan Kehadiran Personal",
    period: "Ibu Titin · Juli 2026",
    icon: UserCheck,
    iconBg: "bg-[#ffff00]",
    iconColor: "text-[#003d7a]",
    stats: [
      { label: "Hadir", value: "21", color: "text-[#1b8659]", bg: "bg-emerald-50" },
      { label: "Izin", value: "2", color: "text-amber-500", bg: "bg-yellow-50" },
      { label: "Alpha", value: "0", color: "text-slate-500", bg: "bg-slate-50" },
    ],
    statsLayout: "grid-cols-3",
  },
  {
    title: "Detail Halangan Kehadiran",
    period: "Sakit, izin, cuti, dan tanpa keterangan",
    icon: ClipboardList,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    tags: [
      { label: "Sakit 0", bg: "bg-emerald-50", color: "text-[#1b8659]" },
      { label: "Izin 2", bg: "bg-yellow-50", color: "text-amber-500" },
      { label: "Cuti 0", bg: "bg-blue-50", color: "text-[#003d7a]" },
    ],
  },
];

const history = [
  {
    file: "Rekap Absensi Guru Juli 2026.pdf",
    time: "Hari ini, 07:42 WIB",
    status: "Berhasil",
    iconBg: "bg-[#1b8659]",
    iconColor: "text-[#ffff00]",
    rowBg: "bg-emerald-50",
    badge: "bg-white text-[#1b8659]",
  },
  {
    file: "Ringkasan Kehadiran Personal.xlsx",
    time: "14 Jul 2026, 13:15 WIB",
    status: "Berhasil",
    iconBg: "bg-[#003d7a]",
    iconColor: "text-[#ffff00]",
    rowBg: "bg-slate-50",
    badge: "bg-white text-[#003d7a]",
  },
  {
    file: "Detail Halangan Juni 2026.pdf",
    time: "12 Jul 2026, 09:04 WIB",
    status: "Gagal",
    iconBg: "bg-red-500",
    iconColor: "text-white",
    rowBg: "bg-red-50",
    badge: "bg-white text-red-500",
  },
];

export default function LaporanPage() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-md">
      <section className="rounded-[30px] bg-gradient-to-br from-[#0c6b46] via-[#1b8659] to-[#075d3d] p-5 text-white overflow-hidden relative shadow-soft">
        <div className="absolute -right-12 -top-10 h-36 w-36 rounded-bl-[54px] bg-[#ffff00] z-0" />
        <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-[#003d7a]/25" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Laporan Absensi
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/82">
              Unduh rekap kehadiran guru berdasarkan periode yang dipilih.
            </p>
          </div>
          <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-white flex items-center justify-center shadow-card ring-4 ring-[#ffff00]/40">
            <FileDown className="text-3xl text-[#1b8659]" />
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              Filter Periode
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pilih bulan dan tahun laporan.
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CalendarDays className="text-2xl text-[#1b8659]" />
          </div>
        </div>

        <form className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Bulan
            </span>
            <select className="mt-2 min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100">
              <option>Juli</option>
              <option>Juni</option>
              <option>Mei</option>
              <option>April</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Tahun
            </span>
            <select className="mt-2 min-h-[48px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100">
              <option>2026</option>
              <option>2025</option>
              <option>2024</option>
            </select>
          </label>
          <button
            type="submit"
            className="col-span-2 min-h-[52px] rounded-2xl bg-[#1b8659] px-5 py-3 text-sm font-black text-[#ffff00] shadow-card transition hover:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Search className="text-xl" />
            Tampilkan Laporan
          </button>
        </form>
      </section>

      <section className="mt-5">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              Daftar Laporan
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              3 file tersedia untuk Juli 2026.
            </p>
          </div>
          <span className="rounded-full bg-[#ffff00] px-3 py-1 text-xs font-black text-[#003d7a]">
            Siap Unduh
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <article
                key={report.title}
                className="rounded-[26px] bg-white p-4 shadow-card ring-1 ring-slate-100"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-12 w-12 shrink-0 rounded-2xl ${report.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`text-2xl ${report.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-bold tracking-tight text-slate-950">
                      {report.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{report.period}</p>
                    {report.stats && (
                      <div
                        className={`mt-3 grid ${report.statsLayout} gap-2 text-xs`}
                      >
                        {report.stats.map((stat) => (
                          <div
                            key={stat.label}
                            className={`rounded-2xl px-3 py-2 ${stat.bg || "bg-slate-50"}`}
                          >
                            <p className="font-bold text-slate-400">
                              {stat.label}
                            </p>
                            <p
                              className={`mt-0.5 font-black ${stat.color || "text-slate-950"}`}
                            >
                              {stat.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {report.tags && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {report.tags.map((tag) => (
                          <span
                            key={tag.label}
                            className={`rounded-full ${tag.bg} px-3 py-1 text-xs font-bold ${tag.color}`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a
                    href="#"
                    className="min-h-[48px] rounded-2xl bg-[#003d7a] px-4 py-3 text-sm font-black text-white transition hover:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FileDown className="text-lg text-[#ffff00]" />
                    PDF
                  </a>
                  <a
                    href="#"
                    className="min-h-[48px] rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#1b8659] transition hover:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <FileText className="text-lg" />
                    Excel
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-5 rounded-[28px] bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              Riwayat Download
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Aktivitas unduhan terakhir.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {history.map((item) => (
            <div
              key={item.file}
              className={`flex items-center gap-3 rounded-2xl ${item.rowBg} p-3`}
            >
              <div
                className={`h-10 w-10 rounded-2xl ${item.iconBg} flex items-center justify-center`}
              >
                {item.status === "Berhasil" ? (
                  <Check className={`text-xl ${item.iconColor}`} />
                ) : (
                  <X className="text-xl text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-950">
                  {item.file}
                </p>
                <p className="text-xs text-slate-500">{item.time}</p>
              </div>
              <span
                className={`rounded-full ${item.badge} px-2.5 py-1 text-xs font-black`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>
      </div>
    </DashboardLayout>
  );
}
