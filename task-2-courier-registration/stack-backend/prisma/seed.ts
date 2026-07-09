import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const approve = await prisma.status.createMany({
    data: [{ tag_name: "APPROVE" }, { tag_name: "REJECT" }, { tag_name: "PENDING" }]
  });
  const courier1 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier1@example.com", password: "32124543", firstname: "John", lastname: "Doe", phone: "988162753", address: "123 Main St" }]
  });
  const courier2 = await prisma.courier.createMany({
    data: [{ status_id: 2, email: "courier2@example.com", password: "32124543", firstname: "Marry", lastname: "Hemme", phone: "988162754", address: "123 Main St" }]
  });
  const courier3 = await prisma.courier.createMany({
    data: [{ status_id: 3, email: "courier3@example.com", password: "32124543", firstname: "Calve", lastname: "Rings", phone: "988162755", address: "123 Main St" }]
  });
  const courier4 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier4@example.com", password: "32124543", firstname: "Jack", lastname: "Nus", phone: "988162756", address: "123 Main St" }]
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
