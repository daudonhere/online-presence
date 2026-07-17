import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const role = (session.user as unknown as { role: string }).role;
  if (role !== "admin") return apiError("Hanya admin yang bisa generate laporan", 403);

  const body = await req.json();
  const { month, year, type } = body as { month?: number; year?: number; type?: string };

  if (!month || !year || !type) {
    return apiError("month, year, dan type wajib diisi");
  }

  if (!["rekap", "personal", "halangan"].includes(type)) {
    return apiError("type harus rekap, personal, atau halangan");
  }

  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];
  const totalDays = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleString("id-ID", { month: "long", year: "numeric" });
  const supabase = getSupabase();

  const titleMap: Record<string, string> = {
    rekap: `Rekap Absensi Guru ${monthName}`,
    personal: `Ringkasan Kehadiran Personal ${monthName}`,
    halangan: `Detail Halangan Kehadiran ${monthName}`,
  };

  let htmlContent = "";
  let csvContent = "";

  if (type === "rekap") {
    const { data: allRecords } = await supabase
      .from("Attendance")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);

    const { data: teachers } = await supabase
      .from("User")
      .select("id, name")
      .eq("role", "teacher");

    const teacherRows: string[] = [];
    const csvRows: string[] = [];

    for (const t of teachers || []) {
      const { data: tAttend } = await supabase
        .from("Attendance")
        .select("status")
        .eq("userId", t.id)
        .gte("date", startDate)
        .lte("date", endDate);

      const tRecords = tAttend || [];
      const h = tRecords.filter((a) => a.status === "hadir").length;
      const i = tRecords.filter((a) => a.status === "izin").length;
      const a = tRecords.filter((a) => a.status === "alpha").length;
      const p = tRecords.filter((a) => a.status === "pending").length;
      teacherRows.push(`<tr><td>${t.name}</td><td>${h}</td><td>${i}</td><td>${a}</td><td>${p}</td></tr>`);
      csvRows.push(`"${t.name}",${h},${i},${a},${p}`);
    }

    const totalHadir = (allRecords || []).filter((r) => r.status === "hadir").length;

    htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titleMap[type]}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a}h1{font-size:20px;margin-bottom:4px}p{color:#64748b;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left}th{font-weight:700;color:#475569}hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}</style></head><body>
<h1>${titleMap[type]}</h1><p>${monthName} · Total Hadir: ${totalHadir} hari</p><hr>
<table><thead><tr><th>Nama</th><th>Hadir</th><th>Izin</th><th>Alpha</th><th>Pending</th></tr></thead><tbody>${teacherRows.join("")}</tbody></table>
<hr><p style="font-size:11px;color:#94a3b8">Dibuat pada ${new Date().toLocaleDateString("id-ID")} — Absensi Al-Riyadl</p></body></html>`;

    csvContent = `"Rekap Absensi Guru"\n"${monthName}"\n\n"Nama","Hadir","Izin","Alpha","Pending"\n${csvRows.join("\n")}\n`;
  } else if (type === "personal") {
    const userId = Number(session.user.id);
    const { data: records } = await supabase
      .from("Attendance")
      .select("*")
      .eq("userId", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    const allRecords = records || [];
    const hadir = allRecords.filter((r) => r.status === "hadir").length;
    const izin = allRecords.filter((r) => r.status === "izin").length;
    const alpha = allRecords.filter((r) => r.status === "alpha").length;
    const pending = allRecords.filter((r) => r.status === "pending").length;

    const rows = allRecords.map((r) => {
      const d = new Date(r.date).toLocaleDateString("id-ID");
      return `<tr><td>${d}</td><td>${r.checkInTime || "-"}</td><td>${r.checkOutTime || "-"}</td><td>${r.status}</td><td>${r.source || "-"}</td></tr>`;
    }).join("");

    const csvRows = allRecords.map((r) =>
      `"${new Date(r.date).toLocaleDateString("id-ID")}","${r.checkInTime || "-"}","${r.checkOutTime || "-"}","${r.status}","${r.source || "-"}"`
    ).join("\n");

    htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titleMap[type]}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a}h1{font-size:20px;margin-bottom:4px}p{color:#64748b;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left}th{font-weight:700;color:#475569}hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}</style></head><body>
<h1>${titleMap[type]}</h1><p>${monthName} · Hadir: ${hadir} · Izin: ${izin} · Alpha: ${alpha} · Pending: ${pending}</p><hr>
<table><thead><tr><th>Tanggal</th><th>Masuk</th><th>Keluar</th><th>Status</th><th>Sumber</th></tr></thead><tbody>${rows}</tbody></table>
<hr><p style="font-size:11px;color:#94a3b8">Dibuat pada ${new Date().toLocaleDateString("id-ID")} — Absensi Al-Riyadl</p></body></html>`;

    csvContent = `"Ringkasan Kehadiran Personal"\n"${monthName}"\n\n"Tanggal","Masuk","Keluar","Status","Sumber"\n${csvRows}\n`;
  } else {
    const userId = Number(session.user.id);
    const { data: obstacles } = await supabase
      .from("Obstacle")
      .select("*")
      .eq("userId", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    const allObstacles = obstacles || [];
    const sakit = allObstacles.filter((o) => o.category === "sakit").length;
    const izin = allObstacles.filter((o) => o.category === "izin").length;
    const cuti = allObstacles.filter((o) => o.category === "cuti").length;

    const rows = allObstacles.map((o) => {
      const d = new Date(o.date).toLocaleDateString("id-ID");
      return `<tr><td>${d}</td><td>${o.category}</td><td>${o.reason}</td><td>${o.status}</td></tr>`;
    }).join("");

    const csvRows = allObstacles.map((o) =>
      `"${new Date(o.date).toLocaleDateString("id-ID")}","${o.category}","${o.reason}","${o.status}"`
    ).join("\n");

    htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titleMap[type]}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a}h1{font-size:20px;margin-bottom:4px}p{color:#64748b;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left}th{font-weight:700;color:#475569}hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}</style></head><body>
<h1>${titleMap[type]}</h1><p>${monthName} · Sakit: ${sakit} · Izin: ${izin} · Cuti: ${cuti}</p><hr>
<table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
<hr><p style="font-size:11px;color:#94a3b8">Dibuat pada ${new Date().toLocaleDateString("id-ID")} — Absensi Al-Riyadl</p></body></html>`;

    csvContent = `"Detail Halangan Kehadiran"\n"${monthName}"\n\n"Tanggal","Kategori","Keterangan","Status"\n${csvRows}\n`;
  }

  const { mkdir, writeFile } = await import("fs/promises");
  const { join } = await import("path");
  const { randomUUID } = await import("crypto");

  const dir = join(process.cwd(), "public", "uploads", "reports");
  await mkdir(dir, { recursive: true });

  const baseName = `${type}_${month}_${year}_${randomUUID().slice(0, 8)}`;
  const htmlPath = `/uploads/reports/${baseName}.html`;
  const csvPath = `/uploads/reports/${baseName}.csv`;

  await writeFile(join(dir, `${baseName}.html`), htmlContent);
  await writeFile(join(dir, `${baseName}.csv`), "\uFEFF" + csvContent);

  const { data: report, error } = await supabase
    .from("Report")
    .insert({
      title: titleMap[type],
      period: monthName,
      fileUrl: htmlPath,
      status: "ready",
    })
    .select()
    .single();

  if (error) throw error;
  return apiSuccess({ report, csvUrl: csvPath }, 201);
});
