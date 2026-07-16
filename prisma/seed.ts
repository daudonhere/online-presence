import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";
import { resolve } from "path";

const dbPath = resolve("dev.db");
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const adminPassword = await hash("Tiger1SHA12@", 10);
  const guruPassword = await hash("guru123", 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { phone: "08123456789" },
    update: {},
    create: {
      phone: "08123456789",
      password: adminPassword,
      name: "Admin Utama",
      role: "admin",
    },
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      subject: "Administrator",
      nip: "19850101 201001 1 001",
      email: "admin@mtsalriyadl.sch.id",
    },
  });

  await prisma.notificationPreference.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      reminderMasuk: false,
      reminderPulang: false,
      monthlySummary: false,
    },
  });

  console.log("  Admin: 08123456789 / Tiger1SHA12@");

  // Guru 1
  const guru1 = await prisma.user.upsert({
    where: { phone: "081222222222" },
    update: {},
    create: {
      phone: "081222222222",
      password: guruPassword,
      name: "Ibu Titin S.Pd",
      role: "teacher",
    },
  });

  await prisma.profile.upsert({
    where: { userId: guru1.id },
    update: {},
    create: {
      userId: guru1.id,
      subject: "Guru Bahasa Indonesia",
      nip: "19870512 201403 2 006",
      email: "titin@mtsalriyadl.sch.id",
    },
  });

  await prisma.notificationPreference.upsert({
    where: { userId: guru1.id },
    update: {},
    create: {
      userId: guru1.id,
      reminderMasuk: true,
      reminderPulang: true,
      monthlySummary: false,
    },
  });

  console.log("  Guru 1: 081222222222 / guru123");

  // Guru 2
  const guru2 = await prisma.user.upsert({
    where: { phone: "081333333333" },
    update: {},
    create: {
      phone: "081333333333",
      password: guruPassword,
      name: "Bapak Ahmad S.Pd",
      role: "teacher",
    },
  });

  await prisma.profile.upsert({
    where: { userId: guru2.id },
    update: {},
    create: {
      userId: guru2.id,
      subject: "Guru Matematika",
      nip: "19860315 201201 1 008",
      email: "ahmad@mtsalriyadl.sch.id",
    },
  });

  await prisma.notificationPreference.upsert({
    where: { userId: guru2.id },
    update: {},
    create: {
      userId: guru2.id,
      reminderMasuk: true,
      reminderPulang: true,
      monthlySummary: true,
    },
  });

  console.log("  Guru 2: 081333333333 / guru123");

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
