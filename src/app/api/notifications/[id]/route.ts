import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const PATCH = withErrorHandling(
  async (_req: NextRequest, ctx?: unknown) => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { id } = (ctx as { params: { id: string } }).params;
    const notifId = Number(id);
    if (isNaN(notifId)) return apiError("ID tidak valid", 400);

    const { error } = await getSupabase()
      .from("Notification")
      .update({ isRead: true })
      .eq("id", notifId)
      .eq("userId", Number(session.user.id));

    if (error) throw error;

    return apiSuccess({ success: true });
  }
);

export const DELETE = withErrorHandling(
  async (_req: NextRequest, ctx?: unknown) => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const { id } = (ctx as { params: { id: string } }).params;
    const notifId = Number(id);
    if (isNaN(notifId)) return apiError("ID tidak valid", 400);

    const { error } = await getSupabase()
      .from("Notification")
      .delete()
      .eq("id", notifId)
      .eq("userId", Number(session.user.id));

    if (error) throw error;

    return apiSuccess({ success: true });
  }
);
