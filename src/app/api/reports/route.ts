import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

interface TeacherDayRow {
  teacherId: number;
  teacherName: string;
  days: Record<number, string>;
  totalHadir: number;
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

  const userId = Number(session.user.id);
  const role = (session.user as unknown as { role: string }).role;
  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];
  const totalDays = new Date(year, month, 0).getDate();

  const monthName = new Date(year, month - 1).toLocaleString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const supabase = getSupabase();

  const { data: records } = await supabase
    .from("Attendance")
    .select("*")
    .eq("userId", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  const { data: obstacles } = await supabase
    .from("Obstacle")
    .select("*")
    .eq("userId", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  const allRecords = records || [];
  const allObstacles = obstacles || [];

  const hadir = allRecords.filter((r) => r.status === "hadir").length;
  const izin = allRecords.filter((r) => r.status === "izin").length;
  const alpha = allRecords.filter((r) => r.status === "alpha").length;
  const sakit = allObstacles.filter((o) => o.category === "sakit").length;
  const izinCount = allObstacles.filter((o) => o.category === "izin").length;
  const cuti = allObstacles.filter((o) => o.category === "cuti").length;

  const hasAttendanceData = allRecords.length > 0;
  const hasObstacleData = allObstacles.length > 0;

  const { data: user } = await supabase
    .from("User")
    .select("name")
    .eq("id", userId)
    .single();

  const reports: Array<{
    id: string;
    title: string;
    period: string;
    type: string;
    stats?: Array<{ label: string; value: string }>;
    tags?: Array<{ label: string }>;
    teachers?: TeacherDayRow[];
    totalDays?: number;
  }> = [];

  if (role === "admin") {
    const { data: teachers } = await supabase
      .from("User")
      .select("id, name")
      .eq("role", "teacher")
      .order("name", { ascending: true });

    const { data: allAttendance } = await supabase
      .from("Attendance")
      .select("userId, date, status")
      .gte("date", startDate)
      .lte("date", endDate);

    const { data: allObstacles } = await supabase
      .from("Obstacle")
      .select("userId, date, category, status")
      .gte("date", startDate)
      .lte("date", endDate)
      .eq("status", "approved");

    const teacherList = teachers || [];
    const attendanceList = allAttendance || [];
    const obstacleList = allObstacles || [];

    const obstacleStatusMap: Record<string, string> = {
      sakit: "S",
      izin: "I",
      cuti: "C",
    };

    const teacherRows: TeacherDayRow[] = teacherList.map((t) => {
      const days: Record<number, string> = {};
      let totalHadir = 0;

      for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const att = attendanceList.find((a) => a.userId === t.id && a.date === dateStr);
        const obs = obstacleList.find((o) => o.userId === t.id && o.date === dateStr);

        if (att) {
          if (att.status === "hadir") {
            days[d] = "H";
            totalHadir++;
          } else if (att.status === "izin") {
            days[d] = "I";
          } else if (att.status === "alpha") {
            days[d] = "A";
          } else if (att.status === "libur") {
            days[d] = "C";
          }
        } else if (obs) {
          const mapped = obstacleStatusMap[obs.category];
          if (mapped) {
            days[d] = mapped;
            if (mapped === "H") totalHadir++;
          }
        }
      }

      return { teacherId: t.id, teacherName: t.name, days, totalHadir };
    });

    const hasAnyData = attendanceList.length > 0 || obstacleList.length > 0;

    if (hasAnyData || teacherList.length > 0) {
      reports.push({
        id: `rekap-${month}-${year}`,
        title: `Rekap Absensi Guru ${monthName}`,
        period: `Periode 01 - ${totalDays} ${new Date(year, month - 1).toLocaleString("id-ID", { month: "long" })} ${year}`,
        type: "rekap",
        stats: [
          { label: "Guru", value: `${teacherList.length} orang` },
          { label: "Hari", value: `${totalDays} hari` },
        ],
        teachers: teacherRows,
        totalDays,
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
