import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  if (session.user.role !== "admin") return apiError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  let query = getSupabase()
    .from("Obstacle")
    .select("*, User!Obstacle_userId_fkey(id, name, phone)")
    .order("date", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  if (monthParam && yearParam) {
    const month = parseInt(monthParam);
    const year = parseInt(yearParam);
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];
    query = query.gte("date", startDate).lte("date", endDate);
  }

  const { data: obstacles, error } = await query;

  if (error) throw error;

  return apiSuccess(obstacles ?? []);
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  if (session.user.role !== "admin") return apiError("Forbidden", 403);

  const body = await req.json();
  const ids = body.ids as number[] | undefined;
  const all = body.all as boolean | undefined;

  if (all) {
    const { data: obstacles } = await getSupabase()
      .from("Obstacle")
      .select("id, fileUrl");
    if (obstacles) {
      const filePaths = obstacles
        .map((o: { fileUrl: string | null }) => o.fileUrl?.split("/obstacles/")[1])
        .filter(Boolean) as string[];
      if (filePaths.length > 0) {
        await getSupabase().storage.from("obstacles").remove(filePaths);
      }
    }
    const { error } = await getSupabase()
      .from("Obstacle")
      .delete()
      .neq("id", 0);
    if (error) throw error;
  } else if (ids && ids.length > 0) {
    const { data: obstacles } = await getSupabase()
      .from("Obstacle")
      .select("id, fileUrl")
      .in("id", ids);
    if (obstacles) {
      const filePaths = obstacles
        .map((o: { fileUrl: string | null }) => o.fileUrl?.split("/obstacles/")[1])
        .filter(Boolean) as string[];
      if (filePaths.length > 0) {
        await getSupabase().storage.from("obstacles").remove(filePaths);
      }
    }
    const { error } = await getSupabase()
      .from("Obstacle")
      .delete()
      .in("id", ids);
    if (error) throw error;
  } else {
    return apiError("Sertakan ids atau all: true", 400);
  }

  return apiSuccess({ success: true });
});
