import { describe, it, expect } from "vitest";
import { parseDecimal, haversine } from "@/lib/geo";

describe("parseDecimal", () => {
  it("parses valid coordinate string", () => {
    const result = parseDecimal("-6.954097, 107.009786");
    expect(result).toEqual({ lat: -6.954097, lng: 107.009786 });
  });

  it("parses without spaces", () => {
    const result = parseDecimal("-6.954097,107.009786");
    expect(result).toEqual({ lat: -6.954097, lng: 107.009786 });
  });

  it("parses with extra spaces", () => {
    const result = parseDecimal("  -6.954097  ,  107.009786  ");
    expect(result).toEqual({ lat: -6.954097, lng: 107.009786 });
  });

  it("returns null for single value", () => {
    expect(parseDecimal("-6.954097")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseDecimal("")).toBeNull();
  });

  it("returns null for non-numeric", () => {
    expect(parseDecimal("abc, def")).toBeNull();
  });

  it("returns null for partial non-numeric", () => {
    expect(parseDecimal("abc, 107.009")).toBeNull();
  });

  it("handles integer coordinates", () => {
    const result = parseDecimal("-6, 107");
    expect(result).toEqual({ lat: -6, lng: 107 });
  });

  it("handles positive coordinates", () => {
    const result = parseDecimal("6.954, 107.009");
    expect(result).toEqual({ lat: 6.954, lng: 107.009 });
  });

  it("returns null for three values", () => {
    expect(parseDecimal("-6.954, 107.009, 0")).toBeNull();
  });
});

describe("haversine", () => {
  it("returns 0 for same point", () => {
    const dist = haversine(-6.954097, 107.009786, -6.954097, 107.009786);
    expect(dist).toBe(0);
  });

  it("calculates small distance correctly (~100m)", () => {
    // Two points ~100m apart in Bandung
    const dist = haversine(-6.954097, 107.009786, -6.953197, 107.009786);
    expect(dist).toBeGreaterThan(90);
    expect(dist).toBeLessThan(110);
  });

  it("calculates ~1km distance", () => {
    // Roughly 1km apart
    const dist = haversine(-6.954, 107.01, -6.945, 107.01);
    expect(dist).toBeGreaterThan(900);
    expect(dist).toBeLessThan(1100);
  });

  it("returns >10m for distant points", () => {
    const dist = haversine(-6.954, 107.01, -7.0, 107.05);
    expect(dist).toBeGreaterThan(10);
  });

  it("returns <10m for nearby points", () => {
    // Very close points
    const dist = haversine(-6.954097, 107.009786, -6.954098, 107.009787);
    expect(dist).toBeLessThan(10);
  });

  it("handles equator crossing", () => {
    const dist = haversine(-0.001, 107.0, 0.001, 107.0);
    expect(dist).toBeGreaterThan(200);
    expect(dist).toBeLessThan(250);
  });

  it("handles international date line", () => {
    const dist = haversine(0, 179.999, 0, -179.999);
    expect(dist).toBeGreaterThan(200);
    expect(dist).toBeLessThan(250);
  });
});
