import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { hash, compare } from "bcryptjs";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return apiError("Password lama dan password baru wajib diisi", 400);
  }

  if (newPassword.length < 6) {
    return apiError("Password baru minimal 6 karakter", 400);
  }

  const userId = Number(session.user.id);
  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("User")
    .select("password")
    .eq("id", userId)
    .single();

  if (!user) return apiError("User tidak ditemukan", 404);

  const valid = await compare(currentPassword, user.password);
  if (!valid) return apiError("Password lama salah", 400);

  const hashed = await hash(newPassword, 10);
  const { error } = await supabase
    .from("User")
    .update({ password: hashed })
    .eq("id", userId);

  if (error) throw error;

  return apiSuccess({ message: "Password berhasil diubah" });
});
