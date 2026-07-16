import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return apiError("Nomor telepon sudah terdaftar", 409);
  }

  const hashed = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      password: hashed,
      profile: {
        create: {
          subject: "",
          nip: "",
          email: "",
        },
      },
      notificationPreference: {
        create: {},
      },
    },
    include: {
      profile: true,
      notificationPreference: true,
    },
  });

  return apiSuccess(
    { message: "Registrasi berhasil", user: { id: user.id, name: user.name, phone: user.phone } },
    201
  );
});
