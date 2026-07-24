import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  if (session.user.role !== "admin") return apiError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  let query = getSupabase()
    .from("ApprovalHistory")
    .select("*, User!ApprovalHistory_performedBy_fkey(name)")
    .order("createdAt", { ascending: false });

  if (entityType && entityId) {
    query = query.eq("entityType", entityType).eq("entityId", Number(entityId));
  } else if (entityType) {
    query = query.eq("entityType", entityType);
  }

  const { data, error } = await query;
  if (error) throw error;

  return apiSuccess(data ?? []);
});
