import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { apiError, withErrorHandling } from "@/lib/api-response";
import { readFile, stat } from "fs/promises";
import { join } from "path";

export const GET = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const params = await (ctx as { params: Promise<{ id: string }> }).params;
  const reportId = parseInt(params.id);
  if (isNaN(reportId)) return apiError("ID tidak valid", 400);

  const { data: report } = await getSupabase()
    .from("Report")
    .select("*")
    .eq("id", reportId)
    .single();

  if (!report) return apiError("Laporan tidak ditemukan", 404);

  const filePath = join(process.cwd(), "public", report.fileUrl);
  try {
    await stat(filePath);
  } catch {
    return apiError("File laporan tidak ditemukan", 404);
  }

  const content = await readFile(filePath);
  const ext = report.fileUrl.split(".").pop()?.toLowerCase();
  const contentType = ext === "csv" ? "text/csv" : "text/html";
  const filename = `${report.title.replace(/\s+/g, "_")}.${ext}`;

  return new Response(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
