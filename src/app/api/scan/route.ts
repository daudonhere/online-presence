import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { scanSchema } from "@/lib/validations";

function parseDms(dms: string): { lat: number; lng: number } | null {
  const match = dms.match(
    /(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/i
  );
  if (!match) return null;

  const lat =
    (Number(match[1]) + Number(match[2]) / 60 + Number(match[3]) / 3600) *
    (match[4].toUpperCase() === "S" ? -1 : 1);
  const lng =
    (Number(match[5]) + Number(match[6]) / 60 + Number(match[7]) / 3600) *
    (match[8].toUpperCase() === "W" ? -1 : 1);

  return { lat, lng };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = scanSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { qrData, latitude, longitude } = result.data;
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

  // Geofence: fetch admin's profile location
  let adminUserId: number;
  if (currentUser?.role === "teacher") {
    adminUserId = qrUserId;
  } else {
    adminUserId = currentUserId;
  }

  const { data: adminProfile } = await supabase
    .from("Profile")
    .select("location")
    .eq("userId", adminUserId)
    .single();

  const locationStr = adminProfile?.location?.trim();
  if (locationStr) {
    const adminLoc = parseDms(locationStr);
    if (adminLoc) {
      const dist = haversine(latitude, longitude, adminLoc.lat, adminLoc.lng);
      if (dist > 10) {
        return apiError(
          `Anda berada ${(dist / 1000).toFixed(1)} km dari lokasi sekolah. Harus berada dalam radius 10 meter.`
        );
      }
    }
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
