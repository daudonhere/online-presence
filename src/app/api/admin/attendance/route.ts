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
  const { id, ids, action } = body as { id?: number; ids?: number[]; action: "approved" | "rejected" };

  if (!action || !["approved", "rejected"].includes(action)) return apiError("action tidak valid", 400);

  const targetIds = ids && ids.length > 0 ? ids : id ? [id] : [];
  if (targetIds.length === 0) return apiError("Sertakan id atau ids", 400);

  const status = action === "approved" ? "hadir" : "alpha";

  const { data, error } = await getSupabase()
    .from("Attendance")
    .update({ status })
    .in("id", targetIds)
    .eq("status", "pending")
    .select();

  if (error) throw error;

  if (data && data.length > 0) {
    const historyInserts = data.map((r: { id: number }) => ({
      entityType: "attendance",
      entityId: r.id,
      action,
      performedBy: Number(session.user.id),
    }));
    await getSupabase().from("ApprovalHistory").insert(historyInserts);
  }

  return apiSuccess({ updated: data?.length ?? 0 });
});
