import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { scanSchema } from "@/lib/validations";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = scanSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { qrData } = result.data;
  const supabase = getSupabase();

  const match = qrData.match(/^ATTENDANCE:USER:(\d+):(.+)$/);
  if (!match) return apiError("Format QR tidak valid");

  const qrUserId = Number(match[1]);
  const currentUserId = Number(session.user.id);

  if (qrUserId === currentUserId) {
    return apiError("Tidak bisa scan QR sendiri");
  }

  const { data: qrUser } = await supabase
    .from("User")
    .select("id, role, name")
    .eq("id", qrUserId)
    .single();

  if (!qrUser) return apiError("User pada QR tidak ditemukan");

  const { data: currentUser } = await supabase
    .from("User")
    .select("role")
    .eq("id", currentUserId)
    .single();

  let attendanceUserId: number;

  if (currentUser?.role === "teacher" && qrUser.role === "admin") {
    attendanceUserId = currentUserId;
  } else if (currentUser?.role === "admin" && qrUser.role === "teacher") {
    attendanceUserId = qrUserId;
  } else {
    return apiError("Scan tidak valid. Guru harus scan QR admin, atau admin harus scan QR guru.");
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("Attendance")
    .select("id")
    .eq("userId", attendanceUserId)
    .eq("date", todayStr)
    .single();

  if (existing) {
    return apiError("User sudah melakukan absensi hari ini");
  }

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const { data: record, error } = await supabase
    .from("Attendance")
    .insert({
      userId: attendanceUserId,
      date: todayStr,
      checkInTime: time,
      status: "hadir",
      source: "qr",
    })
    .select()
    .single();

  if (error) throw error;
  return apiSuccess(record, 201);
});
