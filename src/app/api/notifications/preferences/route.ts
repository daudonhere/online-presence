import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { notificationPrefsSchema } from "@/lib/validations";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { data: prefs } = await getSupabase()
    .from("NotificationPreference")
    .select("*")
    .eq("userId", Number(session.user.id))
    .single();

  return apiSuccess({
    reminderMasuk: prefs?.reminderMasuk ?? true,
    reminderPulang: prefs?.reminderPulang ?? true,
    monthlySummary: prefs?.monthlySummary ?? false,
  });
});

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = notificationPrefsSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { reminderMasuk, reminderPulang, monthlySummary } = result.data;
  const userId = Number(session.user.id);
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("NotificationPreference")
    .select("userId, reminderMasuk, reminderPulang, monthlySummary")
    .eq("userId", userId)
    .single();

  const updateData: Record<string, unknown> = {};
  if (typeof reminderMasuk === "boolean") updateData.reminderMasuk = reminderMasuk;
  if (typeof reminderPulang === "boolean") updateData.reminderPulang = reminderPulang;
  if (typeof monthlySummary === "boolean") updateData.monthlySummary = monthlySummary;

  if (existing) {
    await supabase.from("NotificationPreference").update(updateData).eq("userId", userId);
  } else {
    await supabase.from("NotificationPreference").insert({
      userId,
      reminderMasuk: reminderMasuk ?? true,
      reminderPulang: reminderPulang ?? true,
      monthlySummary: monthlySummary ?? false,
    });
  }

  return apiSuccess({
    reminderMasuk: reminderMasuk ?? existing?.reminderMasuk ?? true,
    reminderPulang: reminderPulang ?? existing?.reminderPulang ?? true,
    monthlySummary: monthlySummary ?? existing?.monthlySummary ?? false,
  });
});
