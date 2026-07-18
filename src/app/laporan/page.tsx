"use client";

import { useState } from "react";
import {
  FileDown,
  CalendarDays,
  FileText,
  UserCheck,
  ClipboardList,
  Loader2,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface ApiStat {
  label: string;
  value: string;
}

interface ApiTag {
  label: string;
}

interface ApiReport {
  id: string;
  title: string;
  period: string;
  type: "rekap" | "personal" | "halangan";
  stats?: ApiStat[];
  tags?: ApiTag[];
}

interface ApiResponse {
  reports: ApiReport[];
  month: number;
  year: number;
  monthName: string;
}

interface ReportCard {
  id: string;
  title: string;
  period: string;
  type: string;
  icon: typeof FileText;
  iconBg: string;
  iconColor: string;
  stats?: { label: string; value: string; color: string; bg: string }[];
  statsLayout?: string;
  tags?: { label: string; bg: string; color: string }[];
}

const typeStyles: Record<
  string,
  { icon: typeof FileText; iconBg: string; iconColor: string }
> = {
  rekap: { icon: FileText, iconBg: "bg-[#1b8659]", iconColor: "text-[#ffff00]" },
  personal: { icon: UserCheck, iconBg: "bg-[#ffff00]", iconColor: "text-[#003d7a]" },
  halangan: { icon: ClipboardList, iconBg: "bg-slate-100", iconColor: "text-slate-600" },
};

const statColors: Record<string, { color: string; bg: string }> = {
  Hadir: { color: "text-[#1b8659]", bg: "bg-emerald-50" },
  Izin: { color: "text-amber-500", bg: "bg-yellow-50" },
  Alpha: { color: "text-slate-500", bg: "bg-slate-50" },
};

const tagColors: Record<string, { bg: string; color: string }> = {
  Sakit: { bg: "bg-emerald-50", color: "text-[#1b8659]" },
  Izin: { bg: "bg-yellow-50", color: "text-amber-500" },
  Cuti: { bg: "bg-blue-50", color: "text-[#003d7a]" },
};

const months = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).sort((a, b) => a - b);

function mapReport(api: ApiReport): ReportCard {
  const style = typeStyles[api.type] || typeStyles.rekap;

  const mapped: ReportCard = {
    id: api.id,
    title: api.title,
    period: api.period,
    type: api.type,
    icon: style.icon,
    iconBg: style.iconBg,
    iconColor: style.iconColor,
  };

  if (api.stats) {
    mapped.stats = api.stats.map((s) => {
      const c = statColors[s.label];
      return {
        label: s.label,
        value: s.value,
        color: c?.color || "text-slate-950",
        bg: c?.bg || "bg-slate-50",
      };
    });
    mapped.statsLayout = api.type === "personal" ? "grid-cols-3" : "grid-cols-2";
  }

  if (api.tags) {
    mapped.tags = api.tags.map((t) => {
      const tagLabel = t.label.split(" ")[0];
      const c = tagColors[tagLabel];
      return {
        label: t.label,
        bg: c?.bg || "bg-slate-50",
        color: c?.color || "text-slate-500",
      };
    });
  }

  return mapped;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(report: ReportCard) {
  const rows = report.stats
    ? report.stats.map((s) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569">${s.label}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:800;color:#0f172a">${s.value}</td></tr>`).join("")
    : "";

  const tags = report.tags
    ? report.tags.map((t) => `<span style="display:inline-block;padding:4px 12px;margin:2px;border-radius:999px;font-size:12px;font-weight:700;background:#f1f5f9;color:#334155">${t.label}</span>`).join("")
    : "";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${report.title}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a}h1{font-size:20px;margin-bottom:4px}p{color:#64748b;font-size:13px;margin-top:2px}table{width:100%;border-collapse:collapse;margin-top:16px}hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}</style></head><body>
<h1>${report.title}</h1><p>${report.period}</p><hr>
${rows ? `<table>${rows}</table>` : ""}
${tags ? `<div style="margin-top:12px">${tags}</div>` : ""}
<hr><p style="font-size:11px;color:#94a3b8">Dibuat pada ${new Date().toLocaleDateString("id-ID")} — Absensi Al-Riyadl</p>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}

function exportExcel(report: ReportCard, monthName: string) {
  let csv = "\uFEFF";
  csv += `"${report.title}"\n`;
  csv += `"${report.period}"\n\n`;

  if (report.stats) {
    csv += "Label,Nilai\n";
    for (const s of report.stats) {
      csv += `"${s.label}","${s.value}"\n`;
    }
  }

  if (report.tags) {
    csv += "\nTag\n";
    for (const t of report.tags) {
      csv += `"${t.label}"\n`;
    }
  }

  csv += `\nDibuat pada ${new Date().toLocaleDateString("id-ID")} — Absensi Al-Riyadl\n`;

  const filename = `${report.title.replace(/\s+/g, "_")}_${monthName.replace(/\s+/g, "_")}.csv`;
  downloadFile(csv, filename, "text/csv;charset=utf-8");
}

export default function LaporanPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading, isError, error } = useQuery<ApiResponse>({
    queryKey: queryKeys.reports.list(month, year),
    queryFn: async () => {
      const res = await fetch(`/api/reports?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Gagal memuat laporan");
      return res.json();
    },
  });

  const reports = data?.reports.map(mapReport) || [];
  const monthName = data?.monthName || "";

  return (
    <DashboardLayout>
      <div className="w-full max-w-md pb-8">
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

        <div className="mt-4 space-y-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Bulan
            </span>
            <div className="mt-2 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {months.map((m) => (
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
                  {m.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Tahun
            </span>
            <div className="mt-2 flex justify-center gap-2">
              {years.map((y) => (
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

      <section className="mt-5">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-950">
              Daftar Laporan
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isLoading
                ? "Memuat laporan..."
                : isError
                  ? error?.message || "Terjadi kesalahan"
                  : reports.length > 0
                    ? `${reports.length} laporan tersedia untuk ${monthName}.`
                    : `Tidak ada laporan untuk ${monthName}.`}
            </p>
          </div>
          {!isLoading && !isError && reports.length > 0 && (
            <span className="rounded-full bg-[#ffff00] px-3 py-1 text-xs font-black text-[#003d7a]">
              Siap Unduh
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#1b8659]" />
            <p className="text-sm font-semibold">Memuat data laporan...</p>
          </div>
        ) : isError ? (
          <div className="mt-8 rounded-2xl bg-red-50 p-4 text-center text-sm font-semibold text-red-500 flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error?.message || "Terjadi kesalahan"}
          </div>
        ) : reports.length === 0 ? (
          <div className="mt-8 mb-8 flex flex-col items-center gap-3 text-slate-400">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Inbox className="text-3xl text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-center">
              Belum ada data laporan untuk periode ini.
            </p>
            <p className="text-xs text-center text-slate-400">
              Data laporan akan muncul setelah ada aktivitas kehadiran.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <article
                  key={report.id}
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
                    <button
                      type="button"
                      onClick={() => exportPDF(report)}
                      className="min-h-[48px] rounded-2xl bg-[#003d7a] px-4 py-3 text-sm font-black text-white transition hover:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <FileDown className="text-lg text-[#ffff00]" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => exportExcel(report, monthName)}
                      className="min-h-[48px] rounded-2xl bg-[#1b8659] px-4 py-3 text-sm font-black text-white transition hover:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <FileText className="text-lg text-white" />
                      Excel
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      </div>
    </DashboardLayout>
  );
}
