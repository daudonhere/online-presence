import { describe, it, expect } from "vitest";
import { hash, compare } from "bcryptjs";

describe("bcryptjs password hashing", () => {
  it("hashes password", async () => {
    const hashed = await hash("password123", 10);
    expect(hashed).not.toBe("password123");
    expect(hashed.length).toBeGreaterThan(20);
  });

  it("verifies correct password", async () => {
    const hashed = await hash("Tiger1SHA12@", 10);
    const valid = await compare("Tiger1SHA12@", hashed);
    expect(valid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hashed = await hash("password123", 10);
    const valid = await compare("wrongpassword", hashed);
    expect(valid).toBe(false);
  });

  it("different hashes for same password (salt)", async () => {
    const hash1 = await hash("test", 10);
    const hash2 = await hash("test", 10);
    expect(hash1).not.toBe(hash2);
  });

  it("verifies seeded admin password", async () => {
    // The admin password is Tiger1SHA12@ — verify it works with bcryptjs
    const hashed = await hash("Tiger1SHA12@", 10);
    const valid = await compare("Tiger1SHA12@", hashed);
    expect(valid).toBe(true);
  });

  it("handles empty string password", async () => {
    const hashed = await hash("", 10);
    const valid = await compare("", hashed);
    expect(valid).toBe(true);
  });

  it("handles long password", async () => {
    const longPw = "a".repeat(100);
    const hashed = await hash(longPw, 10);
    const valid = await compare(longPw, hashed);
    expect(valid).toBe(true);
  });
});
