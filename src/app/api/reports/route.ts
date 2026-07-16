import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

  const userId = Number(session.user.id);
  const role = (session.user as unknown as { role: string }).role;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const monthName = new Date(year, month - 1).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const records = await prisma.attendance.findMany({
    where: { userId, date: { gte: startDate, lte: endDate } },
  });

  const obstacles = await prisma.obstacle.findMany({
    where: { userId, date: { gte: startDate, lte: endDate } },
  });

  const hadir = records.filter((r) => r.status === "hadir").length;
  const izin = records.filter((r) => r.status === "izin").length;
  const alpha = records.filter((r) => r.status === "alpha").length;
  const sakit = obstacles.filter((o) => o.category === "sakit").length;
  const izinCount = obstacles.filter((o) => o.category === "izin").length;
  const cuti = obstacles.filter((o) => o.category === "cuti").length;

  const totalDays = endDate.getDate();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const hasAttendanceData = records.length > 0;
  const hasObstacleData = obstacles.length > 0;

  const reports: Array<{
    id: string;
    title: string;
    period: string;
    type: string;
    stats?: Array<{ label: string; value: string }>;
    tags?: Array<{ label: string }>;
  }> = [];

  if (role === "admin") {
    const allRecords = await prisma.attendance.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    const hasAnyData = allRecords.length > 0;

    if (hasAnyData) {
      const totalHadir = allRecords.filter((r) => r.status === "hadir").length;
      reports.push({
        id: `rekap-${month}-${year}`,
        title: `Rekap Absensi Guru ${monthName}`,
        period: `Periode 01 - ${totalDays} ${new Date(year, month - 1).toLocaleString("id-ID", { month: "long" })} ${year}`,
        type: "rekap",
        stats: [
          { label: "Hari Kerja", value: `${totalDays} hari` },
          { label: "Hadir", value: `${totalHadir} hari` },
        ],
      });
    }
  }

  if (hasAttendanceData) {
    reports.push({
      id: `personal-${month}-${year}`,
      title: "Ringkasan Kehadiran Personal",
      period: `${user?.name || "Guru"} · ${monthName}`,
      type: "personal",
      stats: [
        { label: "Hadir", value: String(hadir) },
        { label: "Izin", value: String(izin) },
        { label: "Alpha", value: String(alpha) },
      ],
    });
  }

  if (hasObstacleData) {
    reports.push({
      id: `halangan-${month}-${year}`,
      title: "Detail Halangan Kehadiran",
      period: "Sakit, izin, cuti, dan tanpa keterangan",
      type: "halangan",
      tags: [
        { label: `Sakit ${sakit}` },
        { label: `Izin ${izinCount}` },
        { label: `Cuti ${cuti}` },
      ],
    });
  }

  return apiSuccess({ reports, month, year, monthName });
});
