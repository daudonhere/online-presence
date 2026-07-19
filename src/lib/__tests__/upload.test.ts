import { describe, it, expect, vi } from "vitest";
import { UploadError } from "@/lib/upload";

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: "test.jpg" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/test.jpg" } }),
      }),
    },
  }),
}));

describe("UploadError", () => {
  it("creates error with message and default status", () => {
    const error = new UploadError("File too large");
    expect(error.message).toBe("File too large");
    expect(error.status).toBe(400);
    expect(error.name).toBe("UploadError");
  });

  it("creates error with custom status", () => {
    const error = new UploadError("Server error", 500);
    expect(error.status).toBe(500);
  });

  it("is instance of Error", () => {
    const error = new UploadError("test");
    expect(error).toBeInstanceOf(Error);
  });
});
