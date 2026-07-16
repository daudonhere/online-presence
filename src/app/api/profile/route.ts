import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { profileUpdateSchema } from "@/lib/validations";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    include: { profile: true },
  });

  if (!user) return apiError("User tidak ditemukan", 404);

  return apiSuccess({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    profile: user.profile,
  });
});

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const body = await req.json();
  const result = profileUpdateSchema.safeParse(body);

  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  const { name, subject, nip, email, phone } = result.data;
  const userId = Number(session.user.id);

  if (phone && phone !== (session.user as unknown as { phone: string }).phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== userId) {
      return apiError("Nomor telepon sudah digunakan", 409);
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
    },
  });

  await prisma.profile.upsert({
    where: { userId },
    update: {
      ...(subject !== undefined && { subject }),
      ...(nip !== undefined && { nip }),
      ...(email !== undefined && { email }),
    },
    create: {
      userId,
      subject: subject || "",
      nip: nip || "",
      email: email || "",
    },
  });

  return apiSuccess({ message: "Profil berhasil diperbarui" });
});
