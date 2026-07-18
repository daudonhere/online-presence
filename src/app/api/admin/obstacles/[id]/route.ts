import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { sendPushToUser } from "@/lib/push";

export const PATCH = withErrorHandling(
  async (req: NextRequest, ctx?: unknown) => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);
    if (session.user.role !== "admin") return apiError("Forbidden", 403);

    const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
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

    const categoryLabel: Record<string, string> = {
      sakit: "Sakit",
      izin: "Izin",
      cuti: "Cuti",
    };
    const catLabel = categoryLabel[obstacle.category] || obstacle.category;
    const statusText = action === "approved" ? "Disetujui" : "Ditolak";

    sendPushToUser(obstacle.userId, {
      title: `Pengajuan ${statusText}`,
      body: `Pengajuan ${catLabel} Anda telah ${statusText.toLowerCase()} oleh admin`,
      url: "/halangan",
      tag: `obstacle-${obstacleId}`,
    }).catch(() => {});

    await getSupabase().from("Notification").insert({
      userId: obstacle.userId,
      title: `Pengajuan ${statusText}`,
      message: `Pengajuan ${catLabel} Anda telah ${statusText.toLowerCase()} oleh admin`,
      type: "obstacle",
      isRead: false,
    });

    if (action === "approved") {
      let attendanceStatus = "izin";
      if (obstacle.category === "sakit") attendanceStatus = "sakit";
      else if (obstacle.category === "cuti") attendanceStatus = "libur";

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

export const DELETE = withErrorHandling(
  async (_req: NextRequest, ctx?: unknown) => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);
    if (session.user.role !== "admin") return apiError("Forbidden", 403);

    const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
    const obstacleId = Number(id);
    if (isNaN(obstacleId)) return apiError("ID tidak valid", 400);

    const { data: obstacle, error: fetchError } = await getSupabase()
      .from("Obstacle")
      .select("id, fileUrl")
      .eq("id", obstacleId)
      .single();

    if (fetchError || !obstacle) return apiError("Pengajuan tidak ditemukan", 404);

    if (obstacle.fileUrl) {
      const path = obstacle.fileUrl.split("/obstacles/")[1];
      if (path) {
        await getSupabase().storage.from("obstacles").remove([path]);
      }
    }

    const { error } = await getSupabase()
      .from("Obstacle")
      .delete()
      .eq("id", obstacleId);

    if (error) throw error;

    return apiSuccess({ success: true });
  }
);
