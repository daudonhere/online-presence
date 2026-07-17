import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { saveFile, UploadError } from "@/lib/upload";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api-response";
import { obstacleSchema } from "@/lib/validations";
import { sendPushToAllAdmins } from "@/lib/push";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { data, error } = await getSupabase()
    .from("Obstacle")
    .select("*")
    .eq("userId", Number(session.user.id))
    .order("createdAt", { ascending: false });

  if (error) throw error;
  return apiSuccess(data);
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

  const { data: record, error } = await getSupabase()
    .from("Obstacle")
    .insert({
      userId: Number(session.user.id),
      category,
      date: new Date(date).toISOString().split("T")[0],
      reason,
      fileUrl,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  const categoryLabel: Record<string, string> = {
    sakit: "Sakit",
    izin: "Izin",
    cuti: "Cuti",
  };

  const { data: user } = await getSupabase()
    .from("User")
    .select("name")
    .eq("id", Number(session.user.id))
    .single();

  const teacherName = user?.name || "Guru";
  const catLabel = categoryLabel[category] || category;

  sendPushToAllAdmins({
    title: "Pengajuan Baru",
    body: `${teacherName} mengajukan ${catLabel} untuk tanggal ${date}`,
    url: "/halangan/admin/persetujuan",
    tag: `obstacle-${record.id}`,
  }).catch(() => {});

  const inAppNotif = await getSupabase()
    .from("User")
    .select("id")
    .eq("role", "admin");

  if (inAppNotif.data) {
    const notifInserts = inAppNotif.data.map((admin) => ({
      userId: admin.id,
      title: "Pengajuan Baru",
      message: `${teacherName} mengajukan ${catLabel} untuk tanggal ${date}`,
      type: "obstacle",
      isRead: false,
    }));
    await getSupabase().from("Notification").insert(notifInserts);
  }

  return apiSuccess(record, 201);
});
