"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
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

interface TeacherDayRow {
  teacherId: number;
  teacherName: string;
  days: Record<number, string>;
  totalHadir: number;
}

interface ApiReport {
  id: string;
  title: string;
  period: string;
  type: "rekap" | "personal" | "halangan";
  stats?: ApiStat[];
  tags?: ApiTag[];
  teachers?: TeacherDayRow[];
  totalDays?: number;
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
  teachers?: TeacherDayRow[];
  totalDays?: number;
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
    teachers: api.teachers,
    totalDays: api.totalDays,
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

function downloadXlsx(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { bookType: "xlsx" });
}

const STATUS_COLOR: Record<string, string> = {
  H: "#1b8659",
  S: "#dc2626",
  I: "#d97706",
  C: "#003d7a",
  A: "#94a3b8",
};

function buildTeacherTableHtml(teachers: TeacherDayRow[], totalDays: number): string {
  let headerDays = "";
  for (let d = 1; d <= totalDays; d++) {
    headerDays += `<th style="padding:3px 2px;border:1px solid #e2e8f0;font-size:7px;text-align:center;width:20px;min-width:14px">${d}</th>`;
  }

  const rows = teachers.map((t, i) => {
    let cells = "";
    for (let d = 1; d <= totalDays; d++) {
      const code = t.days[d] || "";
      const color = STATUS_COLOR[code] || "#e2e8f0";
      const bg = code ? color : "#f8fafc";
      const textColor = code ? "#fff" : "#cbd5e1";
      cells += `<td style="padding:2px;border:1px solid #e2e8f0;text-align:center;font-size:7px;font-weight:700;background:${bg};color:${textColor}">${code}</td>`;
    }
    return `<tr>
      <td style="padding:2px 4px;border:1px solid #e2e8f0;font-size:8px;text-align:center">${i + 1}</td>
      <td style="padding:2px 6px;border:1px solid #e2e8f0;font-size:8px;font-weight:600;white-space:nowrap">${t.teacherName}</td>
      ${cells}
      <td style="padding:2px 4px;border:1px solid #e2e8f0;font-size:8px;font-weight:800;text-align:center">${t.totalHadir}</td>
    </tr>`;
  }).join("");

  return `
    <div style="transform-origin:top left">
    <table style="border-collapse:collapse;margin-top:12px;font-size:9px">
      <thead>
        <tr>
          <th style="padding:3px 4px;border:1px solid #e2e8f0;font-size:8px;text-align:center;background:#0c6b46;color:#fff;width:24px">No</th>
          <th style="padding:3px 6px;border:1px solid #e2e8f0;font-size:8px;text-align:left;background:#0c6b46;color:#fff;white-space:nowrap">Nama Guru</th>
          ${headerDays}
          <th style="padding:3px 4px;border:1px solid #e2e8f0;font-size:8px;text-align:center;background:#0c6b46;color:#fff;white-space:nowrap">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
    <div style="margin-top:12px;font-size:10px;color:#64748b">
      <strong>Keterangan:</strong>
      <span style="color:#1b8659">H</span> = Hadir &nbsp;
      <span style="color:#dc2626">S</span> = Sakit &nbsp;
      <span style="color:#d97706">I</span> = Izin &nbsp;
      <span style="color:#003d7a">C</span> = Cuti &nbsp;
      <span style="color:#94a3b8">A</span> = Alpha
    </div>
  `;
}

function exportPDF(report: ReportCard) {
  let body = "";

  if (report.teachers && report.totalDays) {
    body = buildTeacherTableHtml(report.teachers, report.totalDays);
  } else if (report.stats) {
    const rows = report.stats.map((s) =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569">${s.label}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:800;color:#0f172a">${s.value}</td></tr>`
    ).join("");
    body = `<table style="width:100%;border-collapse:collapse;margin-top:16px">${rows}</table>`;
  }

  if (report.tags) {
    const tags = report.tags.map((t) =>
      `<span style="display:inline-block;padding:4px 12px;margin:2px;border-radius:999px;font-size:12px;font-weight:700;background:#f1f5f9;color:#334155">${t.label}</span>`
    ).join("");
    body += `<div style="margin-top:12px">${tags}</div>`;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${report.title}</title>
<style>
body{font-family:Arial,sans-serif;padding:40px;color:#0f172a;overflow:hidden}
h1{font-size:20px;margin-bottom:4px}
p{color:#64748b;font-size:13px;margin-top:2px}
hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}
@media print{
  @page{size:landscape;margin:8mm}
  body{padding:0;overflow:hidden}
  html{overflow:hidden}
}
</style>
<script>
window.onload=function(){
  var el=document.querySelector("div[style*='transform']");
  if(el){
    var tw=el.scrollWidth;
    var pw=window.innerWidth-20;
    if(tw>pw){el.style.transform="scale("+pw/tw+")";}
  }
}
</script>
</head><body>
<h1>${report.title}</h1><p>${report.period}</p><hr>
${body}
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
  const wb = XLSX.utils.book_new();
  const wsData: (string | number)[][] = [];

  wsData.push([report.title]);
  wsData.push([report.period]);
  wsData.push([]);

  if (report.teachers && report.totalDays) {
    const header = ["No", "Nama Guru"];
    for (let d = 1; d <= report.totalDays; d++) {
      header.push(String(d));
    }
    header.push("Total");
    wsData.push(header);

    const td = report.totalDays;
    report.teachers.forEach((t, i) => {
      const row: (string | number)[] = [i + 1, t.teacherName];
      for (let d = 1; d <= td; d++) {
        row.push(t.days[d] || "");
      }
      row.push(t.totalHadir);
      wsData.push(row);
    });
  } else if (report.stats) {
    wsData.push(["Label", "Nilai"]);
    for (const s of report.stats) {
      wsData.push([s.label, s.value]);
    }
  }

  if (report.tags) {
    wsData.push([]);
    wsData.push(["Keterangan"]);
    for (const t of report.tags) {
      wsData.push([t.label]);
    }
  }

  wsData.push([]);
  wsData.push([`Dibuat pada ${new Date().toLocaleDateString("id-ID")} — Absensi Al-Riyadl`]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  if (report.teachers && report.totalDays) {
    ws["!cols"] = [
      { wch: 4 },
      { wch: 25 },
      ...Array.from({ length: report.totalDays }, () => ({ wch: 4 })),
      { wch: 6 },
    ];
  }

  XLSX.utils.book_append_sheet(wb, ws, "Laporan");

  const filename = `${report.title.replace(/\s+/g, "_")}_${monthName.replace(/\s+/g, "_")}.xlsx`;
  downloadXlsx(wb, filename);
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
