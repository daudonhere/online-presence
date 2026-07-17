import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { endpoint } = await req.json();
  const userId = Number(session.user.id);
  const supabase = getSupabase();

  if (endpoint) {
    const { error } = await supabase
      .from("PushSubscription")
      .delete()
      .eq("userId", userId)
      .eq("endpoint", endpoint);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("PushSubscription")
      .delete()
      .eq("userId", userId);
    if (error) throw error;
  }

  return apiSuccess({ message: "Push subscription berhasil dihapus" });
});
