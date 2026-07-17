import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { checkOutSchema } from "@/lib/validations";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = checkOutSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { time } = result.data;
  const userId = Number(session.user.id);
  const todayStr = new Date().toISOString().split("T")[0];

  const { data: existing } = await getSupabase()
    .from("Attendance")
    .select("*")
    .eq("userId", userId)
    .eq("date", todayStr)
    .single();

  if (!existing) {
    return apiError("Anda belum melakukan absensi masuk hari ini");
  }

  if (existing.checkOutTime) {
    return apiError("Anda sudah melakukan check-out hari ini");
  }

  const { data: record, error } = await getSupabase()
    .from("Attendance")
    .update({ checkOutTime: time })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) throw error;
  return apiSuccess(record);
});
