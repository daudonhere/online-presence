import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendPushToUser } from "@/lib/push";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const supabase = getSupabase();

  const { data: prefs } = await supabase
    .from("NotificationPreference")
    .select("userId, monthlySummary")
    .eq("monthlySummary", true);

  if (!prefs || prefs.length === 0) {
    return apiSuccess({ sent: 0, message: "No users with monthly summary enabled" });
  }

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const startDate = lastMonth.toISOString().split("T")[0];
  const endDate = lastMonthEnd.toISOString().split("T")[0];
  const monthName = lastMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  let sent = 0;

  for (const pref of prefs) {
    const { data: attendance } = await supabase
      .from("Attendance")
      .select("status")
      .eq("userId", pref.userId)
      .gte("date", startDate)
      .lte("date", endDate);

    const hadir = (attendance ?? []).filter((a) => a.status === "hadir").length;
    const izin = (attendance ?? []).filter((a) => a.status === "izin").length;
    const alpha = (attendance ?? []).filter((a) => a.status === "alpha").length;

    const message = `Ringkasan ${monthName}: Hadir ${hadir} hari, Izin ${izin} hari, Alpha ${alpha} hari.`;

    const result = await sendPushToUser(pref.userId, {
      title: "Ringkasan Bulanan",
      body: message,
      url: "/analisa",
      tag: `monthly-summary-${now.getMonth()}-${now.getFullYear()}`,
    });

    if (result.sent > 0) {
      await supabase.from("Notification").insert({
        userId: pref.userId,
        title: "Ringkasan Bulanan",
        message,
        type: "system",
        isRead: false,
      });
      sent++;
    }
  }

  return apiSuccess({ sent, total: prefs.length, month: monthName });
});
