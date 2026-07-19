import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.fn();
let mockGetSupabase: ReturnType<typeof vi.fn>;

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/push", () => ({
  sendPushToAllAdmins: vi.fn().mockResolvedValue(undefined),
  sendPushToUser: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabase: (...args: unknown[]) => (mockGetSupabase as unknown as (...a: unknown[]) => unknown)(...args),
}));

function jsonReq(url: string, body: Record<string, unknown>, method = "POST") {
  return new NextRequest(url, { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
}

type Row = Record<string, unknown>;

interface MockChain {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

class MockDb {
  tables: Record<string, Row[]> = {};
  nextId = 1;
  eqFilters: Record<string, Record<string, unknown>> = {};

  constructor(seed: Record<string, Row[]> = {}) {
    this.tables = {};
    for (const [k, v] of Object.entries(seed)) {
      this.tables[k] = [...v];
    }
  }

  getTable(name: string): Row[] {
    if (!this.tables[name]) this.tables[name] = [];
    return this.tables[name];
  }

  chain(name: string) {
    this.eqFilters[name] = {};
    const state: { filters: Record<string, unknown> } = { filters: {} };

    const methods: Record<string, ReturnType<typeof vi.fn>> = {};
    const t = methods as unknown as MockChain;

    methods.select = vi.fn().mockImplementation(() => t);
    methods.insert = vi.fn().mockImplementation((data: Row | Row[]) => {
      const rows = Array.isArray(data) ? data : [data];
      for (const r of rows) {
        this.getTable(name).push({ id: this.nextId++, ...r });
      }
      return t;
    });
    methods.update = vi.fn().mockImplementation((data: Row) => {
      const table = this.getTable(name);
      const filters = state.filters;
      for (const row of table) {
        if (Object.entries(filters).every(([k, v]) => row[k] === v)) {
          Object.assign(row, data);
        }
      }
      return t;
    });
    methods.delete = vi.fn().mockImplementation(() => {
      const table = this.getTable(name);
      const filters = state.filters;
      this.tables[name] = table.filter((row: Row) =>
        !Object.entries(filters).every(([k, v]) => row[k] === v)
      );
      return t;
    });
    methods.eq = vi.fn().mockImplementation((field: string, value: unknown) => {
      state.filters[field] = value;
      return t;
    });
    methods.neq = vi.fn().mockReturnValue(t);
    methods.in = vi.fn().mockReturnValue(t);
    methods.gte = vi.fn().mockReturnValue(t);
    methods.lte = vi.fn().mockReturnValue(t);
    methods.order = vi.fn().mockReturnValue(t);
    methods.single = vi.fn().mockImplementation(() => {
      const table = this.getTable(name);
      const filters = state.filters;
      const row = table.find((r: Row) =>
        Object.entries(filters).every(([k, v]) => r[k] === v)
      );
      return Promise.resolve({ data: row || null, error: null });
    });

    return t;
  }

  supabase() {
    return {
      from: vi.fn().mockImplementation((name: string) => this.chain(name)),
      storage: {
        from: () => ({
          upload: vi.fn().mockResolvedValue({ data: { path: "test.jpg" }, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/test.jpg" } }),
          remove: vi.fn().mockResolvedValue({ error: null }),
        }),
      },
    };
  }
}

describe("Integration: Attendance flow", () => {
  let db: MockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    db = new MockDb();
    mockGetSupabase = vi.fn(() => db.supabase());
  });

  it("check-in then check-out", async () => {
    const today = new Date().toISOString().split("T")[0];
    mockAuth.mockResolvedValue({ user: { id: "2" } });

    const { POST: postAttendance } = await import("@/app/api/attendance/route");
    const checkInRes = await postAttendance(
      jsonReq("http://localhost/api/attendance", { date: today, time: "07:30" })
    );
    expect(checkInRes.status).toBe(201);
    expect(db.tables.Attendance.length).toBe(1);
    expect(db.tables.Attendance[0].checkInTime).toBe("07:30");

    const { POST: postCheckout } = await import("@/app/api/attendance/check-out/route");
    const checkOutRes = await postCheckout(
      jsonReq("http://localhost/api/attendance/check-out", { time: "15:00" })
    );
    expect(checkOutRes.status).toBe(200);
    expect(db.tables.Attendance[0].checkOutTime).toBe("15:00");
  });

  it("duplicate check-in returns error", async () => {
    const today = new Date().toISOString().split("T")[0];
    mockAuth.mockResolvedValue({ user: { id: "2" } });
    db.tables.Attendance = [{ id: 1, userId: 2, date: today }];

    const { POST } = await import("@/app/api/attendance/route");
    const res = await POST(jsonReq("http://localhost/api/attendance", { date: today, time: "08:00" }));
    const body = await res.json();
    expect(body.error).toContain("sudah melakukan absensi");
  });

  it("check-out without check-in returns error", async () => {
    mockAuth.mockResolvedValue({ user: { id: "2" } });

    const { POST } = await import("@/app/api/attendance/check-out/route");
    const res = await POST(jsonReq("http://localhost/api/attendance/check-out", { time: "15:00" }));
    const body = await res.json();
    expect(body.error).toContain("belum melakukan absensi");
  });
});

describe("Integration: Obstacle submit → admin approve", () => {
  let db: MockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    db = new MockDb({
      User: [{ id: 1, role: "admin", name: "Admin", phone: "08123456789" }],
    });
    mockGetSupabase = vi.fn(() => db.supabase());
  });

  it("approve sakit → attendance status is sakit", async () => {
    const today = new Date().toISOString().split("T")[0];
    db.tables.User.push({ id: 2, name: "Budi", role: "teacher", phone: "081222222222" });

    // Teacher submits obstacle
    mockAuth.mockResolvedValue({ user: { id: "2" } });
    const { POST: postObstacle } = await import("@/app/api/obstacles/route");
    const formData = new FormData();
    formData.set("date", today);
    formData.set("category", "sakit");
    formData.set("reason", "Demam");
    const submitRes = await postObstacle(new NextRequest("http://localhost/api/obstacles", { method: "POST", body: formData }));
    expect(submitRes.status).toBe(201);
    expect(db.tables.Obstacle[0].category).toBe("sakit");

    // Admin approves
    mockAuth.mockResolvedValue({ user: { id: "1", role: "admin" } });
    const { PATCH } = await import("@/app/api/admin/obstacles/[id]/route");
    const approveRes = await PATCH(
      jsonReq("http://localhost/api/admin/obstacles/1", { action: "approved" }),
      { params: Promise.resolve({ id: "1" }) }
    );
    const body = await approveRes.json();
    expect(body.success).toBe(true);

    // Verify attendance
    expect(db.tables.Attendance.length).toBe(1);
    expect(db.tables.Attendance[0].status).toBe("sakit");
    expect(db.tables.Attendance[0].source).toBe("obstacle");
  });

  it("approve cuti → attendance status is libur", async () => {
    const today = new Date().toISOString().split("T")[0];
    db.tables.User.push({ id: 2, name: "Budi", role: "teacher", phone: "081222222222" });
    db.getTable("Obstacle").push({ id: 1, userId: 2, category: "cuti", date: today, status: "pending", reason: "Cuti" });

    mockAuth.mockResolvedValue({ user: { id: "1", role: "admin" } });
    const { PATCH } = await import("@/app/api/admin/obstacles/[id]/route");
    await PATCH(
      jsonReq("http://localhost/api/admin/obstacles/1", { action: "approved" }),
      { params: Promise.resolve({ id: "1" }) }
    );

    expect(db.tables.Attendance[0].status).toBe("libur");
  });

  it("reject → no attendance created", async () => {
    const today = new Date().toISOString().split("T")[0];
    db.tables.User.push({ id: 2, name: "Budi", role: "teacher", phone: "081222222222" });
    db.getTable("Obstacle").push({ id: 1, userId: 2, category: "izin", date: today, status: "pending", reason: "Izin" });

    mockAuth.mockResolvedValue({ user: { id: "1", role: "admin" } });
    const { PATCH } = await import("@/app/api/admin/obstacles/[id]/route");
    const res = await PATCH(
      jsonReq("http://localhost/api/admin/obstacles/1", { action: "rejected" }),
      { params: Promise.resolve({ id: "1" }) }
    );
    const body = await res.json();
    expect(body.status).toBe("rejected");
    expect(db.tables.Obstacle[0].status).toBe("rejected");
    expect(db.tables.Attendance?.length ?? 0).toBe(0);
  });

  it("cannot approve already-processed obstacle", async () => {
    db.tables.User.push({ id: 2, name: "Budi", role: "teacher", phone: "081222222222" });
    db.getTable("Obstacle").push({ id: 1, userId: 2, category: "sakit", date: "2026-07-18", status: "approved", reason: "Flu" });

    mockAuth.mockResolvedValue({ user: { id: "1", role: "admin" } });
    const { PATCH } = await import("@/app/api/admin/obstacles/[id]/route");
    const res = await PATCH(
      jsonReq("http://localhost/api/admin/obstacles/1", { action: "approved" }),
      { params: Promise.resolve({ id: "1" }) }
    );
    const body = await res.json();
    expect(body.error).toContain("sudah diproses");
  });
});

describe("Integration: Profile update", () => {
  let db: MockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    db = new MockDb({
      User: [{ id: 2, name: "Budi", phone: "081222222222", role: "teacher" }],
      Profile: [{ userId: 2, subject: "Matematika", nip: "123", email: "budi@test.com" }],
    });
    mockGetSupabase = vi.fn(() => db.supabase());
  });

  it("update profile with location", async () => {
    mockAuth.mockResolvedValue({ user: { id: "2", phone: "081222222222" } });

    const { PUT } = await import("@/app/api/profile/route");
    const res = await PUT(
      jsonReq("http://localhost/api/profile", {
        name: "Budi Updated",
        location: "-6.954097, 107.009786",
      })
    );
    expect(res.status).toBe(200);
    expect(db.tables.User[0].name).toBe("Budi Updated");
    expect(db.tables.Profile[0].location).toBe("-6.954097, 107.009786");
  });

  it("rejects duplicate phone", async () => {
    db.tables.User.push({ id: 3, name: "Other", phone: "08111111111", role: "teacher" });
    mockAuth.mockResolvedValue({ user: { id: "2", phone: "081222222222" } });

    const { PUT } = await import("@/app/api/profile/route");
    const res = await PUT(jsonReq("http://localhost/api/profile", { phone: "08111111111" }));
    const body = await res.json();
    expect(body.error).toContain("sudah digunakan");
  });
});

describe("Integration: Authorization", () => {
  let db: MockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    db = new MockDb();
    mockGetSupabase = vi.fn(() => db.supabase());
  });

  it("teacher blocked from admin endpoints", async () => {
    mockAuth.mockResolvedValue({ user: { id: "2", role: "teacher" } });
    const { GET } = await import("@/app/api/admin/obstacles/route");
    const res = await GET(new NextRequest("http://localhost/api/admin/obstacles"));
    expect(res.status).toBe(403);
  });

  it("teacher blocked from approving obstacles", async () => {
    mockAuth.mockResolvedValue({ user: { id: "2", role: "teacher" } });
    const { PATCH } = await import("@/app/api/admin/obstacles/[id]/route");
    const res = await PATCH(
      jsonReq("http://localhost/api/admin/obstacles/1", { action: "approved" }),
      { params: Promise.resolve({ id: "1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("unauthenticated user gets 401", async () => {
    mockAuth.mockResolvedValue(null);
    const { GET } = await import("@/app/api/attendance/last/route");
    const res = await GET(new NextRequest("http://localhost/api/attendance/last"));
    expect(res.status).toBe(401);
  });
});
