import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();
const mockAuth = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: mockFrom,
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/file.jpg" } }),
      }),
    },
  }),
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/push", () => ({
  sendPushToAllAdmins: vi.fn().mockResolvedValue(undefined),
}));

function setupChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = mockSelect.mockReturnValue(chain);
  chain.insert = mockInsert.mockReturnValue(chain);
  chain.update = mockUpdate.mockReturnValue(chain);
  chain.eq = mockEq.mockReturnValue(chain);
  chain.single = mockSingle.mockReturnValue(chain);
  chain.order = mockOrder.mockReturnValue(chain);
  mockFrom.mockReturnValue(chain);
  return chain;
}

function jsonReq(url: string, body: Record<string, unknown>, method = "POST") {
  return new NextRequest(url, {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/attendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupChain();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("@/app/api/attendance/route");
    const req = jsonReq("http://localhost/api/attendance", { date: "2026-07-18", time: "07:30" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1" } });
    const { POST } = await import("@/app/api/attendance/route");
    const req = jsonReq("http://localhost/api/attendance", { date: "", time: "25:00" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates attendance for today", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1" } });
    const today = new Date().toISOString().split("T")[0];
    mockSingle
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: { id: 1, userId: 1, date: today, status: "pending" } });

    const { POST } = await import("@/app/api/attendance/route");
    const req = jsonReq("http://localhost/api/attendance", { date: today, time: "07:30" });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("rejects duplicate attendance today", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1" } });
    const today = new Date().toISOString().split("T")[0];
    mockSingle.mockResolvedValueOnce({ data: { id: 1 } });

    const { POST } = await import("@/app/api/attendance/route");
    const req = jsonReq("http://localhost/api/attendance", { date: today, time: "07:30" });
    const res = await POST(req);
    const body = await res.json();
    expect(body.error).toContain("sudah melakukan absensi");
  });
});

describe("POST /api/attendance/check-out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupChain();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("@/app/api/attendance/check-out/route");
    const req = jsonReq("http://localhost/api/attendance/check-out", { time: "15:30" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid time", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1" } });
    const { POST } = await import("@/app/api/attendance/check-out/route");
    const req = jsonReq("http://localhost/api/attendance/check-out", { time: "25:00" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns error when no check-in today", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1" } });
    mockSingle.mockResolvedValue({ data: null });
    const { POST } = await import("@/app/api/attendance/check-out/route");
    const req = jsonReq("http://localhost/api/attendance/check-out", { time: "15:30" });
    const res = await POST(req);
    const body = await res.json();
    expect(body.error).toContain("belum melakukan absensi");
  });

  it("returns error when already checked out", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1" } });
    mockSingle.mockResolvedValue({ data: { id: 1, checkOutTime: "15:00" } });
    const { POST } = await import("@/app/api/attendance/check-out/route");
    const req = jsonReq("http://localhost/api/attendance/check-out", { time: "16:00" });
    const res = await POST(req);
    const body = await res.json();
    expect(body.error).toContain("sudah melakukan check-out");
  });
});

describe("GET /api/attendance/last", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupChain();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { GET } = await import("@/app/api/attendance/last/route");
    const req = new NextRequest("http://localhost/api/attendance/last");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns null when no attendance today", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1" } });
    mockSingle.mockResolvedValue({ data: null });
    const { GET } = await import("@/app/api/attendance/last/route");
    const req = new NextRequest("http://localhost/api/attendance/last");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupChain();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("@/app/api/scan/route");
    const req = jsonReq("http://localhost/api/scan", {
      qrData: "ATTENDANCE:USER:1:Admin",
      latitude: -6.954,
      longitude: 107.01,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid QR format", async () => {
    mockAuth.mockResolvedValue({ user: { id: "2" } });
    const { POST } = await import("@/app/api/scan/route");
    const req = jsonReq("http://localhost/api/scan", {
      qrData: "INVALID",
      latitude: -6.954,
      longitude: 107.01,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects scanning own QR", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1" } });
    const { POST } = await import("@/app/api/scan/route");
    const req = jsonReq("http://localhost/api/scan", {
      qrData: "ATTENDANCE:USER:1:Admin",
      latitude: -6.954,
      longitude: 107.01,
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.error).toContain("Tidak bisa scan QR sendiri");
  });

  it("rejects same-role scan (teacher→teacher)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "2" } });
    mockSingle
      .mockResolvedValueOnce({ data: { id: 3, role: "teacher", name: "Guru" } })
      .mockResolvedValueOnce({ data: { role: "teacher" } });

    const { POST } = await import("@/app/api/scan/route");
    const req = jsonReq("http://localhost/api/scan", {
      qrData: "ATTENDANCE:USER:3:Guru",
      latitude: -6.954,
      longitude: 107.01,
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.error).toContain("Scan tidak valid");
  });

  it("rejects when too far from school location", async () => {
    mockAuth.mockResolvedValue({ user: { id: "2" } });
    mockSingle
      .mockResolvedValueOnce({ data: { id: 1, role: "admin", name: "Admin" } })
      .mockResolvedValueOnce({ data: { role: "teacher" } })
      .mockResolvedValueOnce({ data: { location: "-7.0, 107.5" } });

    const { POST } = await import("@/app/api/scan/route");
    const req = jsonReq("http://localhost/api/scan", {
      qrData: "ATTENDANCE:USER:1:Admin",
      latitude: -6.954,
      longitude: 107.01,
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.error).toContain("radius 10 meter");
  });
});
