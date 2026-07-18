import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const GET = withErrorHandling(
  async (_req: NextRequest, ctx?: unknown) => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);
    if (session.user.role !== "admin") return apiError("Forbidden", 403);

    const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
    const teacherId = Number(id);
    if (isNaN(teacherId)) return apiError("ID tidak valid", 400);

    const { data: user, error } = await getSupabase()
      .from("User")
      .select("id, name, phone, role, createdAt")
      .eq("id", teacherId)
      .single();

    if (error || !user) return apiError("Guru tidak ditemukan", 404);

    const { data: profile } = await getSupabase()
      .from("Profile")
      .select("subject, nip, email, avatarUrl, location")
      .eq("userId", teacherId)
      .single();

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

    const { data: attendance } = await getSupabase()
      .from("Attendance")
      .select("date, status, checkInTime, source")
      .eq("userId", teacherId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    const { data: obstacles } = await getSupabase()
      .from("Obstacle")
      .select("date, category, reason, status")
      .eq("userId", teacherId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    return apiSuccess({
      user,
      profile: profile || null,
      attendance: attendance || [],
      obstacles: obstacles || [],
    });
  }
);

export const PUT = withErrorHandling(
  async (req: NextRequest, ctx?: unknown) => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);
    if (session.user.role !== "admin") return apiError("Forbidden", 403);

    const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
    const teacherId = Number(id);
    if (isNaN(teacherId)) return apiError("ID tidak valid", 400);

    const body = await req.json();
    const { name, phone, subject, nip, email } = body;

    if (!name || !phone) return apiError("Nama dan telepon wajib diisi", 400);

    const supabase = getSupabase();

    const { error: userError } = await supabase
      .from("User")
      .update({ name, phone })
      .eq("id", teacherId);

    if (userError) throw userError;

    const { data: existingProfile } = await supabase
      .from("Profile")
      .select("id")
      .eq("userId", teacherId)
      .single();

    if (existingProfile) {
      const { error: profileError } = await supabase
        .from("Profile")
        .update({ subject: subject || "", nip: nip || "", email: email || "" })
        .eq("userId", teacherId);
      if (profileError) throw profileError;
    } else {
      const { error: profileError } = await supabase
        .from("Profile")
        .insert({ userId: teacherId, subject: subject || "", nip: nip || "", email: email || "" });
      if (profileError) throw profileError;
    }

    return apiSuccess({ success: true });
  }
);

export const DELETE = withErrorHandling(
  async (_req: NextRequest, ctx?: unknown) => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);
    if (session.user.role !== "admin") return apiError("Forbidden", 403);

    const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
    const teacherId = Number(id);
    if (isNaN(teacherId)) return apiError("ID tidak valid", 400);

    if (teacherId === Number(session.user.id)) {
      return apiError("Tidak bisa menghapus akun sendiri", 400);
    }

    const supabase = getSupabase();

    await supabase.from("Profile").delete().eq("userId", teacherId);
    await supabase.from("Attendance").delete().eq("userId", teacherId);
    await supabase.from("Obstacle").delete().eq("userId", teacherId);
    await supabase.from("Notification").delete().eq("userId", teacherId);
    await supabase.from("PushSubscription").delete().eq("userId", teacherId);

    const { error } = await supabase.from("User").delete().eq("id", teacherId);
    if (error) throw error;

    return apiSuccess({ success: true });
  }
);
