import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { endpoint, p256dh, auth: authKey } = await req.json();

  if (!endpoint || !p256dh || !authKey) {
    return apiError("Data push subscription tidak lengkap", 400);
  }

  const userId = Number(session.user.id);
  const supabase = getSupabase();

  const { error } = await supabase.from("PushSubscription").upsert(
    {
      userId,
      endpoint,
      p256dh,
      auth: authKey,
      userAgent: req.headers.get("user-agent") || "",
      updatedAt: new Date().toISOString(),
    },
    { onConflict: "userId,endpoint" }
  );

  if (error) throw error;

  return apiSuccess({ message: "Push subscription berhasil didaftarkan" });
});

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = Number(session.user.id);
  const supabase = getSupabase();

  const { data } = await supabase
    .from("PushSubscription")
    .select("id")
    .eq("userId", userId)
    .limit(1);

  return apiSuccess({ subscribed: (data ?? []).length > 0 });
});
