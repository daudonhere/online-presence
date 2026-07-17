import { NextRequest, NextResponse } from "next/server";

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

export function withErrorHandling<T extends NextRequest>(
  handler: (req: T, ctx?: unknown) => Promise<Response>
) {
  return async (req: T, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ApiError) {
        return apiError(error.message, error.status);
      }
      console.error("[API Error]", error);
      return apiError("Terjadi kesalahan server", 500);
    }
  };
}
