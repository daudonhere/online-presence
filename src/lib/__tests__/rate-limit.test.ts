import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimit("test-key");
  });

  it("allows first request", () => {
    const result = checkRateLimit("test-key", 5, 60000);
    expect(result.allowed).toBe(true);
  });

  it("allows up to max attempts", () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit("test-key", 5, 60000);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks after max attempts", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-key", 5, 60000);
    }
    const result = checkRateLimit("test-key", 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets after window expires", async () => {
    checkRateLimit("test-key", 2, 5);
    checkRateLimit("test-key", 2, 5);
    const blocked = checkRateLimit("test-key", 2, 5);
    expect(blocked.allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 10));
    const after = checkRateLimit("test-key", 2, 5);
    expect(after.allowed).toBe(true);
  });

  it("different keys are independent", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("key-a", 5, 60000);
    }
    const result = checkRateLimit("key-b", 5, 60000);
    expect(result.allowed).toBe(true);
  });

  it("resetRateLimit clears the key", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-key", 5, 60000);
    }
    resetRateLimit("test-key");
    const result = checkRateLimit("test-key", 5, 60000);
    expect(result.allowed).toBe(true);
  });

  it("returns retryAfter in seconds", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-key", 5, 60000);
    }
    const result = checkRateLimit("test-key", 5, 60000);
    expect(result.retryAfter).toBeLessThanOrEqual(60);
    expect(result.retryAfter).toBeGreaterThanOrEqual(1);
  });
});
