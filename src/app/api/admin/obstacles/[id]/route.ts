import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const PATCH = withErrorHandling(
  async (req: NextRequest, ctx?: unknown) => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);
    if (session.user.role !== "admin") return apiError("Forbidden", 403);

    const { id } = (ctx as { params: { id: string } }).params;
    const obstacleId = Number(id);
    if (isNaN(obstacleId)) return apiError("ID tidak valid", 400);

    const body = await req.json();
    const action = body.action as string;
    if (action !== "approved" && action !== "rejected") {
      return apiError("Action harus 'approved' atau 'rejected'", 400);
    }

    const { data: obstacle, error: fetchError } = await getSupabase()
      .from("Obstacle")
      .select("*")
      .eq("id", obstacleId)
      .single();

    if (fetchError || !obstacle) return apiError("Pengajuan tidak ditemukan", 404);
    if (obstacle.status !== "pending") return apiError("Pengajuan sudah diproses", 400);

    const { error: updateError } = await getSupabase()
      .from("Obstacle")
      .update({
        status: action,
        reviewedBy: Number(session.user.id),
        reviewedAt: new Date().toISOString(),
      })
      .eq("id", obstacleId);

    if (updateError) throw updateError;

    if (action === "approved") {
      let attendanceStatus = "izin";
      if (obstacle.category === "cuti") attendanceStatus = "libur";

      const { data: existing } = await getSupabase()
        .from("Attendance")
        .select("id")
        .eq("userId", obstacle.userId)
        .eq("date", obstacle.date)
        .single();

      if (existing) {
        await getSupabase()
          .from("Attendance")
          .update({ status: attendanceStatus, source: "obstacle" })
          .eq("id", existing.id);
      } else {
        await getSupabase()
          .from("Attendance")
          .insert({
            userId: obstacle.userId,
            date: obstacle.date,
            status: attendanceStatus,
            source: "obstacle",
          });
      }
    }

    return apiSuccess({ success: true, status: action });
  }
);
