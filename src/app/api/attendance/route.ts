import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { attendanceSchema } from "@/lib/validations";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let query = getSupabase()
    .from("Attendance")
    .select("*")
    .eq("userId", Number(session.user.id));

  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split("T")[0];
    query = query.gte("date", startDate).lte("date", endDate);
  }

  const { data, error } = await query.order("date", { ascending: false });
  if (error) throw error;

  return apiSuccess(data);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = attendanceSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { date, time, notes } = result.data;
  const userId = Number(session.user.id);
  const dateStr = new Date(date).toISOString().split("T")[0];

  const { data: existing } = await getSupabase()
    .from("Attendance")
    .select("id")
    .eq("userId", userId)
    .eq("date", dateStr)
    .single();

  if (existing) {
    return apiError("Anda sudah melakukan absensi hari ini");
  }

  const { data: record, error } = await getSupabase()
    .from("Attendance")
    .insert({
      userId,
      date: dateStr,
      checkInTime: time,
      notes: notes || null,
      status: "pending",
      source: "manual",
    })
    .select()
    .single();

  if (error) throw error;
  return apiSuccess(record, 201);
});
