import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile, UploadError } from "@/lib/upload";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { obstacleSchema } from "@/lib/validations";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const records = await prisma.obstacle.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(records);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const formData = await req.formData();
  const date = formData.get("date") as string;
  const category = formData.get("category") as string;
  const reason = formData.get("reason") as string;
  const file = formData.get("file") as File | null;

  const result = obstacleSchema.safeParse({ date, category, reason });
  if (!result.success) {
    return apiError(result.error.issues[0].message, 400);
  }

  let fileUrl: string | null = null;
  if (file && file.size > 0) {
    try {
      fileUrl = await saveFile(file, "obstacles");
    } catch (err) {
      if (err instanceof UploadError) {
        return apiError(err.message, err.status);
      }
      return apiError("Gagal upload file", 500);
    }
  }

  const record = await prisma.obstacle.create({
    data: {
      userId: Number(session.user.id),
      category,
      date: new Date(date),
      reason,
      fileUrl,
      status: "pending",
    },
  });

  return apiSuccess(record, 201);
});
