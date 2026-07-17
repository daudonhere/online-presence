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
    .select("userId, reminderMasuk")
    .eq("reminderMasuk", true);

  if (!prefs || prefs.length === 0) {
    return apiSuccess({ sent: 0, message: "No users with reminder enabled" });
  }

  let sent = 0;

  for (const pref of prefs) {
    const today = new Date().toISOString().split("T")[0];

    const { data: todayAttendance } = await supabase
      .from("Attendance")
      .select("id")
      .eq("userId", pref.userId)
      .eq("date", today)
      .single();

    if (todayAttendance) continue;

    const result = await sendPushToUser(pref.userId, {
      title: "Selamat Pagi",
      body: "Jangan lupa absen hari ini! Silakan scan QR atau absen manual.",
      url: "/",
      tag: "reminder-masuk",
    });

    if (result.sent > 0) {
      await supabase.from("Notification").insert({
        userId: pref.userId,
        title: "Selamat Pagi",
        message: "Jangan lupa absen hari ini! Silakan scan QR atau absen manual.",
        type: "attendance",
        isRead: false,
      });
      sent++;
    }
  }

  return apiSuccess({ sent, total: prefs.length });
});
