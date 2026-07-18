import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { profileUpdateSchema } from "@/lib/validations";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const userId = Number(session.user.id);
  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("User")
    .select("id, name, phone, role")
    .eq("id", userId)
    .single();

  if (!user) return apiError("User tidak ditemukan", 404);

  const { data: profile } = await supabase
    .from("Profile")
    .select("*")
    .eq("userId", userId)
    .single();

  return apiSuccess({ ...user, profile });
});

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = profileUpdateSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { name, subject, nip, email, phone, location } = result.data;
  const userId = Number(session.user.id);
  const supabase = getSupabase();

  if (phone && phone !== (session.user as unknown as { phone: string }).phone) {
    const { data: existing } = await supabase
      .from("User")
      .select("id")
      .eq("phone", phone)
      .single();

    if (existing && existing.id !== userId) {
      return apiError("Nomor telepon sudah digunakan", 409);
    }
  }

  const userUpdate: Record<string, unknown> = {};
  if (name) userUpdate.name = name;
  if (phone) userUpdate.phone = phone;
  if (Object.keys(userUpdate).length > 0) {
    await supabase.from("User").update(userUpdate).eq("id", userId);
  }

  const { data: existingProfile } = await supabase
    .from("Profile")
    .select("userId")
    .eq("userId", userId)
    .single();

  if (existingProfile) {
    const profileUpdate: Record<string, unknown> = {};
    if (subject !== undefined) profileUpdate.subject = subject;
    if (nip !== undefined) profileUpdate.nip = nip;
    if (email !== undefined) profileUpdate.email = email;
    if (location !== undefined) profileUpdate.location = location;
    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from("Profile").update(profileUpdate).eq("userId", userId);
    }
  } else {
    await supabase.from("Profile").insert({
      userId,
      subject: subject || "",
      nip: nip || "",
      email: email || "",
    });
  }

  return apiSuccess({ message: "Profil berhasil diperbarui" });
});
