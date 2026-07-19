import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  attendanceSchema,
  checkOutSchema,
  obstacleSchema,
  notificationPrefsSchema,
  scanSchema,
} from "@/lib/validations";

describe("registerSchema", () => {
  it("accepts valid data", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      phone: "08123456789",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      phone: "08123456789",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone format", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      phone: "12345",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone not starting with 0", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      phone: "62812345678",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 6 chars", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      phone: "08123456789",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("sanitizes HTML from name", () => {
    const result = registerSchema.safeParse({
      name: "<b>Bold</b> Name",
      phone: "08123456789",
      password: "123456",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Bold Name");
    }
  });

  it("accepts phone with 10 digits", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      phone: "081234567890",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects phone with letters", () => {
    const result = registerSchema.safeParse({
      name: "Budi",
      phone: "0812345abc",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid data", () => {
    const result = loginSchema.safeParse({
      phone: "08123456789",
      password: "password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty phone", () => {
    const result = loginSchema.safeParse({ phone: "", password: "password" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ phone: "08123456789", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("accepts valid data with all fields", () => {
    const result = profileUpdateSchema.safeParse({
      name: "Budi",
      subject: "Matematika",
      nip: "123456",
      email: "budi@test.com",
      phone: "08123456789",
      location: "-6.954097, 107.009786",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all optional)", () => {
    const result = profileUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid decimal location", () => {
    const result = profileUpdateSchema.safeParse({
      location: "-6.954097, 107.009786",
    });
    expect(result.success).toBe(true);
  });

  it("accepts location without spaces", () => {
    const result = profileUpdateSchema.safeParse({
      location: "-6.954097,107.009786",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid location format", () => {
    const result = profileUpdateSchema.safeParse({
      location: "not-a-coordinate",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = profileUpdateSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone", () => {
    const result = profileUpdateSchema.safeParse({ phone: "12345" });
    expect(result.success).toBe(false);
  });

  it("sanitizes HTML from name", () => {
    const result = profileUpdateSchema.safeParse({
      name: "<b>Bold</b> Name",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Bold Name");
    }
  });
});

describe("attendanceSchema", () => {
  it("accepts valid data", () => {
    const result = attendanceSchema.safeParse({
      date: "2026-07-18",
      time: "07:30",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with notes", () => {
    const result = attendanceSchema.safeParse({
      date: "2026-07-18",
      time: "07:30",
      notes: "Hadir tepat waktu",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty date", () => {
    const result = attendanceSchema.safeParse({ date: "", time: "07:30" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid time format", () => {
    const result = attendanceSchema.safeParse({ date: "2026-07-18", time: "25:00" });
    expect(result.success).toBe(false);
  });

  it("rejects time with single digit hour", () => {
    const result = attendanceSchema.safeParse({ date: "2026-07-18", time: "7:30" });
    expect(result.success).toBe(false);
  });

  it("accepts midnight", () => {
    const result = attendanceSchema.safeParse({ date: "2026-07-18", time: "00:00" });
    expect(result.success).toBe(true);
  });

  it("accepts 23:59", () => {
    const result = attendanceSchema.safeParse({ date: "2026-07-18", time: "23:59" });
    expect(result.success).toBe(true);
  });
});

describe("checkOutSchema", () => {
  it("accepts valid time", () => {
    const result = checkOutSchema.safeParse({ time: "15:30" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid time", () => {
    const result = checkOutSchema.safeParse({ time: "24:00" });
    expect(result.success).toBe(false);
  });
});

describe("obstacleSchema", () => {
  it("accepts valid sakit", () => {
    const result = obstacleSchema.safeParse({
      date: "2026-07-18",
      category: "sakit",
      reason: "Demam tinggi",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid izin", () => {
    const result = obstacleSchema.safeParse({
      date: "2026-07-18",
      category: "izin",
      reason: "Urusan keluarga",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid cuti", () => {
    const result = obstacleSchema.safeParse({
      date: "2026-07-18",
      category: "cuti",
      reason: "Cuti tahunan",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = obstacleSchema.safeParse({
      date: "2026-07-18",
      category: "libur",
      reason: "Liburan",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty reason", () => {
    const result = obstacleSchema.safeParse({
      date: "2026-07-18",
      category: "sakit",
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects reason over 250 chars", () => {
    const result = obstacleSchema.safeParse({
      date: "2026-07-18",
      category: "sakit",
      reason: "a".repeat(251),
    });
    expect(result.success).toBe(false);
  });

  it("accepts reason at exactly 250 chars", () => {
    const result = obstacleSchema.safeParse({
      date: "2026-07-18",
      category: "sakit",
      reason: "a".repeat(250),
    });
    expect(result.success).toBe(true);
  });

  it("sanitizes HTML from reason", () => {
    const result = obstacleSchema.safeParse({
      date: "2026-07-18",
      category: "sakit",
      reason: "<b>Sakit</b> flu",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe("Sakit flu");
    }
  });
});

describe("notificationPrefsSchema", () => {
  it("accepts valid data", () => {
    const result = notificationPrefsSchema.safeParse({
      reminderMasuk: true,
      monthlySummary: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = notificationPrefsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean values", () => {
    const result = notificationPrefsSchema.safeParse({
      reminderMasuk: "yes",
    });
    expect(result.success).toBe(false);
  });
});

describe("scanSchema", () => {
  it("accepts valid scan data", () => {
    const result = scanSchema.safeParse({
      qrData: "ATTENDANCE:USER:1:Budi",
      latitude: -6.954,
      longitude: 107.01,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty qrData", () => {
    const result = scanSchema.safeParse({
      qrData: "",
      latitude: -6.954,
      longitude: 107.01,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid qrData format", () => {
    const result = scanSchema.safeParse({
      qrData: "INVALID:FORMAT",
      latitude: -6.954,
      longitude: 107.01,
    });
    expect(result.success).toBe(false);
  });

  it("rejects latitude out of range", () => {
    const result = scanSchema.safeParse({
      qrData: "ATTENDANCE:USER:1:Budi",
      latitude: 91,
      longitude: 107.01,
    });
    expect(result.success).toBe(false);
  });

  it("rejects longitude out of range", () => {
    const result = scanSchema.safeParse({
      qrData: "ATTENDANCE:USER:1:Budi",
      latitude: -6.954,
      longitude: 181,
    });
    expect(result.success).toBe(false);
  });

  it("accepts boundary coordinates", () => {
    const result = scanSchema.safeParse({
      qrData: "ATTENDANCE:USER:1:Budi",
      latitude: -90,
      longitude: -180,
    });
    expect(result.success).toBe(true);
  });
});
