import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  if (session.user.role !== "admin") return apiError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  let query = getSupabase()
    .from("Attendance")
    .select("*, User!Attendance_userId_fkey(id, name, phone)")
    .eq("source", "manual")
    .eq("status", "pending")
    .order("date", { ascending: false });

  if (monthParam && yearParam) {
    const month = parseInt(monthParam);
    const year = parseInt(yearParam);
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];
    query = query.gte("date", startDate).lte("date", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  return apiSuccess(data ?? []);
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  if (session.user.role !== "admin") return apiError("Forbidden", 403);

  const body = await req.json();
  const { id, action } = body as { id: number; action: "approved" | "rejected" };

  if (!id || !action) return apiError("id dan action wajib diisi", 400);
  if (!["approved", "rejected"].includes(action)) return apiError("action tidak valid", 400);

  const status = action === "approved" ? "hadir" : "alpha";

  const { data, error } = await getSupabase()
    .from("Attendance")
    .update({ status })
    .eq("id", id)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw error;
  if (!data) return apiError("Absensi tidak ditemukan atau sudah diproses", 404);

  return apiSuccess(data);
});
