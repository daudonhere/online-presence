import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const todayStr = new Date().toISOString().split("T")[0];

  const { data } = await getSupabase()
    .from("Attendance")
    .select("*")
    .eq("userId", Number(session.user.id))
    .eq("date", todayStr)
    .single();

  return apiSuccess(data || null);
});
