import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));
  const isAdmin = session.user.role === "admin";

  const startDate = localDate(new Date(year, month - 1, 1));
  const endDate = localDate(new Date(year, month, 0));
  const totalDays = new Date(year, month, 0).getDate();
  const today = localDate(now);

  if (isAdmin) {
    const { data: teachers } = await getSupabase()
      .from("User")
      .select("id")
      .eq("role", "teacher");

    const totalTeachers = teachers?.length || 0;

    const { data: allAttendance } = await getSupabase()
      .from("Attendance")
      .select("date, status")
      .gte("date", startDate)
      .lte("date", endDate);

    const { data: todayObstacles } = await getSupabase()
      .from("Obstacle")
      .select("category")
      .eq("date", today)
      .eq("status", "approved");

    const todayIzinCount = todayObstacles?.filter(
      (o) => o.category === "izin" || o.category === "cuti"
    ).length || 0;

    const todaySakitCount = todayObstacles?.filter(
      (o) => o.category === "sakit"
    ).length || 0;

    const dailyChart: { day: number; hadir: number }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const hadirCount = (allAttendance || []).filter(
        (r) => r.date === dateStr && r.status === "hadir"
      ).length;
      dailyChart.push({ day: d, hadir: hadirCount });
    }

    const todayHadir = dailyChart.find((d) => d.day === now.getDate())?.hadir ?? 0;
    const tidakHadirHari = Math.max(0, totalTeachers - todayHadir - todayIzinCount - todaySakitCount);

    const weeks: {
      week: string;
      date: string;
      days: { day: string; date: number; hadir: number; isToday: boolean }[];
    }[] = [];

    const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    let weekNum = 1;
    let currentWeekDays: { day: string; date: number; hadir: number; isToday: boolean }[] = [];

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0) continue;

      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const hadirCount = (allAttendance || []).filter(
        (r) => r.date === dateStr && r.status === "hadir"
      ).length;

      currentWeekDays.push({
        day: dayNames[currentWeekDays.length] || `D${d}`,
        date: d,
        hadir: hadirCount,
        isToday: dateStr === today,
      });

      if (dayOfWeek === 6 || d === totalDays) {
        const firstDay = currentWeekDays[0].date;
        const lastDay = currentWeekDays[currentWeekDays.length - 1].date;
        weeks.push({
          week: `Minggu ${weekNum}`,
          date: `${firstDay}–${lastDay} ${new Date(year, month - 1).toLocaleString("id-ID", { month: "long" })}`,
          days: currentWeekDays,
        });
        currentWeekDays = [];
        weekNum++;
      }
    }

    return apiSuccess({
      month,
      year,
      totalTeachers,
      todayHadir,
      todayIzin: todayIzinCount,
      todaySakit: todaySakitCount,
      tidakHadirHari,
      dailyChart,
      weeks,
    });
  }

  const userId = Number(session.user.id);
  const { data: records } = await getSupabase()
    .from("Attendance")
    .select("*")
    .eq("userId", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  const allRecords = records || [];
  const izin = allRecords.filter((r) => r.status === "izin").length;
  const alpha = allRecords.filter((r) => r.status === "alpha").length;

  const dailyChart: { day: number; hadir: number }[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const rec = allRecords.find((r) => new Date(r.date).getDate() === d);
    dailyChart.push({
      day: d,
      hadir: rec && rec.status === "hadir" ? 1 : 0,
    });
  }

  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const weeks: {
    week: string;
    date: string;
    days: { day: string; date: number; hadir: number; isToday: boolean }[];
  }[] = [];

  let weekNum = 1;
  let currentWeekDays: { day: string; date: number; hadir: number; isToday: boolean }[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) continue;

    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const rec = allRecords.find((r) => new Date(r.date).getDate() === d);

    currentWeekDays.push({
      day: dayNames[currentWeekDays.length] || `D${d}`,
      date: d,
      hadir: rec && rec.status === "hadir" ? 1 : 0,
      isToday: dateStr === today,
    });

    if (dayOfWeek === 6 || d === totalDays) {
      const firstDay = currentWeekDays[0].date;
      const lastDay = currentWeekDays[currentWeekDays.length - 1].date;
      weeks.push({
        week: `Minggu ${weekNum}`,
        date: `${firstDay}–${lastDay} ${new Date(year, month - 1).toLocaleString("id-ID", { month: "long" })}`,
        days: currentWeekDays,
      });
      currentWeekDays = [];
      weekNum++;
    }
  }

  return apiSuccess({
    month,
    year,
    totalTeachers: 1,
    todayHadir: allRecords.find((r) => new Date(r.date).getDate() === now.getDate() && r.status === "hadir") ? 1 : 0,
    todayIzin: izin,
    todaySakit: 0,
    tidakHadirHari: alpha,
    dailyChart,
    weeks,
  });
});
