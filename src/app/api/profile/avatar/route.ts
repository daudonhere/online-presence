import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile, UploadError } from "@/lib/upload";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;

  if (!file) return apiError("File avatar tidak ditemukan");

  let url: string;
  try {
    url = await saveFile(file, "avatars");
  } catch (err) {
    if (err instanceof UploadError) {
      return apiError(err.message, err.status);
    }
    return apiError("Gagal upload avatar", 500);
  }

  await prisma.profile.upsert({
    where: { userId: Number(session.user.id) },
    update: { avatarUrl: url },
    create: {
      userId: Number(session.user.id),
      subject: "",
      nip: "",
      email: "",
      avatarUrl: url,
    },
  });

  return apiSuccess({ avatarUrl: url });
});
