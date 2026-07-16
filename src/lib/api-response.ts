import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case "P2002":
      return apiError("Data sudah ada (duplikat)", 409);
    case "P2003":
      return apiError("Data terkait tidak ditemukan", 400);
    case "P2025":
      return apiError("Data tidak ditemukan", 404);
    default:
      return apiError("Kesalahan database", 500);
  }
}

export function withErrorHandling<T extends NextRequest>(
  handler: (req: T, ctx?: unknown) => Promise<Response>
) {
  return async (req: T, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(error);
      }
      if (error instanceof ApiError) {
        return apiError(error.message, error.status);
      }
      console.error("[API Error]", error);
      return apiError("Terjadi kesalahan server", 500);
    }
  };
}
