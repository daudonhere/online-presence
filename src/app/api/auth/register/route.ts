import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { hash } from "bcryptjs";
import { registerSchema } from "@/lib/validations";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed, retryAfter } = checkRateLimit(`register:${ip}`, 5, 60000);
  if (!allowed) {
    return apiError(`Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik`, 429);
  }

  const body = await req.json();
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { name, phone, password } = result.data;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("User")
    .select("id")
    .eq("phone", phone)
    .single();

  if (existing) {
    return apiError("Nomor telepon sudah terdaftar", 409);
  }

  const hashed = await hash(password, 10);

  const { data: user, error: userError } = await supabase
    .from("User")
    .insert({ name, phone, password: hashed })
    .select("id, name, phone")
    .single();

  if (userError) throw userError;

  await supabase.from("Profile").insert({ userId: user.id });
  await supabase.from("NotificationPreference").insert({ userId: user.id });

  return apiSuccess(
    { message: "Registrasi berhasil", user: { id: user.id, name: user.name, phone: user.phone } },
    201
  );
});
