import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const totalDays = endDate.getDate();
  const monthName = new Date(year, month - 1).toLocaleString("id-ID", { month: "long", year: "numeric" });

  const titleMap: Record<string, string> = {
    rekap: `Rekap Absensi Guru ${monthName}`,
    personal: `Ringkasan Kehadiran Personal ${monthName}`,
    halangan: `Detail Halangan Kehadiran ${monthName}`,
  };

  let htmlContent = "";
  let csvContent = "";

  if (type === "rekap") {
    const allRecords = await prisma.attendance.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });
    const teachers = await prisma.user.findMany({
      where: { role: "teacher" },
      include: { attendance: { where: { date: { gte: startDate, lte: endDate } } } },
    });

    const teacherRows = teachers.map((t) => {
      const hadir = t.attendance.filter((a) => a.status === "hadir").length;
      const izin = t.attendance.filter((a) => a.status === "izin").length;
      const alpha = t.attendance.filter((a) => a.status === "alpha").length;
      const pending = t.attendance.filter((a) => a.status === "pending").length;
      return `<tr><td>${t.name}</td><td>${hadir}</td><td>${izin}</td><td>${alpha}</td><td>${pending}</td></tr>`;
    }).join("");

    const totalHadir = allRecords.filter((r) => r.status === "hadir").length;

    htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titleMap[type]}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a}h1{font-size:20px;margin-bottom:4px}p{color:#64748b;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left}th{font-weight:700;color:#475569}hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}</style></head><body>
<h1>${titleMap[type]}</h1><p>${monthName} · Total Hadir: ${totalHadir} hari</p><hr>
<table><thead><tr><th>Nama</th><th>Hadir</th><th>Izin</th><th>Alpha</th><th>Pending</th></tr></thead><tbody>${teacherRows}</tbody></table>
<hr><p style="font-size:11px;color:#94a3b8">Dibuat pada ${new Date().toLocaleDateString("id-ID")} — Absensi Al-Riyadl</p></body></html>`;

    csvContent = `"Rekap Absensi Guru"\n"${monthName}"\n\n"Nama","Hadir","Izin","Alpha","Pending"\n`;
    for (const t of teachers) {
      const h = t.attendance.filter((a) => a.status === "hadir").length;
      const i = t.attendance.filter((a) => a.status === "izin").length;
      const a = t.attendance.filter((a) => a.status === "alpha").length;
      const p = t.attendance.filter((a) => a.status === "pending").length;
      csvContent += `"${t.name}",${h},${i},${a},${p}\n`;
    }
  } else if (type === "personal") {
    const userId = Number(session.user.id);
    const records = await prisma.attendance.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: "asc" },
    });
    const hadir = records.filter((r) => r.status === "hadir").length;
    const izin = records.filter((r) => r.status === "izin").length;
    const alpha = records.filter((r) => r.status === "alpha").length;
    const pending = records.filter((r) => r.status === "pending").length;

    const rows = records.map((r) => {
      const d = new Date(r.date).toLocaleDateString("id-ID");
      return `<tr><td>${d}</td><td>${r.checkInTime || "-"}</td><td>${r.checkOutTime || "-"}</td><td>${r.status}</td><td>${r.source || "-"}</td></tr>`;
    }).join("");

    htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titleMap[type]}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a}h1{font-size:20px;margin-bottom:4px}p{color:#64748b;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left}th{font-weight:700;color:#475569}hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}</style></head><body>
<h1>${titleMap[type]}</h1><p>${monthName} · Hadir: ${hadir} · Izin: ${izin} · Alpha: ${alpha} · Pending: ${pending}</p><hr>
<table><thead><tr><th>Tanggal</th><th>Masuk</th><th>Keluar</th><th>Status</th><th>Sumber</th></tr></thead><tbody>${rows}</tbody></table>
<hr><p style="font-size:11px;color:#94a3b8">Dibuat pada ${new Date().toLocaleDateString("id-ID")} — Absensi Al-Riyadl</p></body></html>`;

    csvContent = `"Ringkasan Kehadiran Personal"\n"${monthName}"\n\n"Tanggal","Masuk","Keluar","Status","Sumber"\n`;
    for (const r of records) {
      csvContent += `"${new Date(r.date).toLocaleDateString("id-ID")}","${r.checkInTime || "-"}","${r.checkOutTime || "-"}","${r.status}","${r.source || "-"}"\n`;
    }
  } else {
    const userId = Number(session.user.id);
    const obstacles = await prisma.obstacle.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      include: { user: { select: { name: true } } },
      orderBy: { date: "asc" },
    });
    const sakit = obstacles.filter((o) => o.category === "sakit").length;
    const izin = obstacles.filter((o) => o.category === "izin").length;
    const cuti = obstacles.filter((o) => o.category === "cuti").length;

    const rows = obstacles.map((o) => {
      const d = new Date(o.date).toLocaleDateString("id-ID");
      return `<tr><td>${d}</td><td>${o.category}</td><td>${o.reason}</td><td>${o.status}</td></tr>`;
    }).join("");

    htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titleMap[type]}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a}h1{font-size:20px;margin-bottom:4px}p{color:#64748b;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left}th{font-weight:700;color:#475569}hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}</style></head><body>
<h1>${titleMap[type]}</h1><p>${monthName} · Sakit: ${sakit} · Izin: ${izin} · Cuti: ${cuti}</p><hr>
<table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
<hr><p style="font-size:11px;color:#94a3b8">Dibuat pada ${new Date().toLocaleDateString("id-ID")} — Absensi Al-Riyadl</p></body></html>`;

    csvContent = `"Detail Halangan Kehadiran"\n"${monthName}"\n\n"Tanggal","Kategori","Keterangan","Status"\n`;
    for (const o of obstacles) {
      csvContent += `"${new Date(o.date).toLocaleDateString("id-ID")}","${o.category}","${o.reason}","${o.status}"\n`;
    }
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

  const report = await prisma.report.create({
    data: {
      title: titleMap[type],
      period: monthName,
      fileUrl: htmlPath,
      status: "ready",
    },
  });

  return apiSuccess({ report, csvUrl: csvPath }, 201);
});
