import { describe, it, expect } from "vitest";
import { apiError, apiSuccess, sanitize } from "@/lib/api-response";

describe("sanitize", () => {
  it("removes HTML tags", () => {
    expect(sanitize("<b>bold</b>")).toBe("bold");
  });

  it("removes script tags", () => {
    expect(sanitize("<script>alert('xss')</script>")).toBe("alert('xss')");
  });

  it("removes nested tags", () => {
    expect(sanitize("<div><span>text</span></div>")).toBe("text");
  });

  it("trims whitespace", () => {
    expect(sanitize("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitize("")).toBe("");
  });

  it("handles plain text", () => {
    expect(sanitize("hello world")).toBe("hello world");
  });

  it("handles self-closing tags", () => {
    expect(sanitize("hello<br/>world")).toBe("helloworld");
  });

  it("handles img tags", () => {
    expect(sanitize('<img src="x" />text')).toBe("text");
  });
});

describe("apiError", () => {
  it("returns error response with default 400", async () => {
    const response = apiError("Bad request");
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Bad request" });
  });

  it("returns error response with custom status", async () => {
    const response = apiError("Not found", 404);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: "Not found" });
  });

  it("returns 500 for server errors", async () => {
    const response = apiError("Internal error", 500);
    expect(response.status).toBe(500);
  });
});

describe("apiSuccess", () => {
  it("returns success response with default 200", async () => {
    const response = apiSuccess({ id: 1, name: "test" });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ id: 1, name: "test" });
  });

  it("returns success response with custom status", async () => {
    const response = apiSuccess({ id: 1 }, 201);
    expect(response.status).toBe(201);
  });

  it("handles null data", async () => {
    const response = apiSuccess(null);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toBeNull();
  });

  it("handles array data", async () => {
    const response = apiSuccess([1, 2, 3]);
    const body = await response.json();
    expect(body).toEqual([1, 2, 3]);
  });
});
