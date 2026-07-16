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
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const records = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });

  const totalDays = endDate.getDate();
  const hadir = records.filter((r) => r.status === "hadir").length;
  const izin = records.filter((r) => r.status === "izin").length;
  const alpha = records.filter((r) => r.status === "alpha").length;
  const libur = records.filter((r) => r.status === "libur").length;

  const workDays = totalDays - libur || hadir + izin + alpha;
  const percentage = workDays > 0 ? Math.round((hadir / workDays) * 100) : 0;

  let rating = "Belum Ada Data";
  if (percentage >= 90) rating = "Sangat Baik";
  else if (percentage >= 75) rating = "Baik";
  else if (percentage >= 60) rating = "Cukup";
  else if (percentage > 0) rating = "Kurang";

  const dailyChart: { day: number; value: number }[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const rec = records.find(
      (r) => new Date(r.date).getDate() === d
    );
    let value = 25;
    if (rec) {
      if (rec.status === "hadir") value = 90 + Math.random() * 10;
      else if (rec.status === "izin") value = 55 + Math.random() * 10;
      else if (rec.status === "alpha") value = 20 + Math.random() * 10;
    } else if (dateObj.getDay() === 0 || dateObj.getDay() === 6) {
      value = 25;
    }
    dailyChart.push({ day: d, value: Math.round(value) });
  }

  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum"];
  const weeks: {
    week: string;
    date: string;
    summary: string;
    days: { day: string; date: number; status: string }[];
  }[] = [];

  let weekNum = 1;
  for (let startDay = 1; startDay <= totalDays; startDay += 5) {
    const endDay = Math.min(startDay + 4, totalDays);
    const weekRecords = records.filter((r) => {
      const d = new Date(r.date).getDate();
      return d >= startDay && d <= endDay;
    });

    const days = [];
    for (let d = startDay; d <= endDay; d++) {
      const dateObj = new Date(year, month - 1, d);
      if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;
      const rec = weekRecords.find((r) => new Date(r.date).getDate() === d);
      days.push({
        day: dayNames[days.length] || `D${d}`,
        date: d,
        status: rec ? rec.status : "libur",
      });
    }

    const h = weekRecords.filter((r) => r.status === "hadir").length;
    const i = weekRecords.filter((r) => r.status === "izin").length;
    const summaryParts: string[] = [];
    if (h > 0) summaryParts.push(`${h} Hadir`);
    if (i > 0) summaryParts.push(`${i} Izin`);

    weeks.push({
      week: `Minggu ${weekNum}`,
      date: `${startDay}–${endDay} ${new Date(year, month - 1).toLocaleString("id-ID", { month: "long" })}`,
      summary: summaryParts.join(" · ") || "Belum ada data",
      days,
    });
    weekNum++;
  }

  return apiSuccess({
    month,
    year,
    percentage,
    rating,
    hadir,
    izin,
    alpha,
    libur,
    dailyChart,
    weeks,
  });
});
