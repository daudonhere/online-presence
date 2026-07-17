import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { data, error } = await getSupabase()
    .from("Notification")
    .select("*")
    .eq("userId", Number(session.user.id))
    .order("createdAt", { ascending: false })
    .limit(50);

  if (error) throw error;

  const unreadCount = (data ?? []).filter((n) => !n.isRead).length;

  return apiSuccess({ notifications: data ?? [], unreadCount });
});

export const PATCH = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = Number(session.user.id);

  const { error } = await getSupabase()
    .from("Notification")
    .update({ isRead: true })
    .eq("userId", userId)
    .eq("isRead", false);

  if (error) throw error;

  return apiSuccess({ success: true });
});
