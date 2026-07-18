import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  if (session.user.role !== "admin") return apiError("Forbidden", 403);

  const { data: teachers, error } = await getSupabase()
    .from("User")
    .select("id, name, phone, role, createdAt, Profile(subject, nip, email, avatarUrl, location)")
    .eq("role", "teacher")
    .order("name", { ascending: true });

  if (error) throw error;

  const today = new Date().toISOString().split("T")[0];
  const teacherIds = (teachers || []).map((t) => t.id);

  const { data: todayAtt } = await getSupabase()
    .from("Attendance")
    .select("userId, status")
    .in("userId", teacherIds)
    .eq("date", today);

  const attMap: Record<number, string> = {};
  (todayAtt || []).forEach((a) => { attMap[a.userId] = a.status; });

  const result = (teachers || []).map((t) => {
    const profile = Array.isArray(t.Profile) ? t.Profile[0] : t.Profile;
    return {
      id: t.id,
      name: t.name,
      phone: t.phone,
      role: t.role,
      createdAt: t.createdAt,
      subject: profile?.subject || "",
      nip: profile?.nip || "",
      email: profile?.email || "",
      avatarUrl: profile?.avatarUrl || "",
      todayStatus: attMap[t.id] || null,
    };
  });

  return apiSuccess(result);
});
