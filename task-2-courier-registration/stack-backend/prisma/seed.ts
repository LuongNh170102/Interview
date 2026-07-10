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
    data: [{ tag_name: "approve" }, { tag_name: "reject" }, { tag_name: "pending" }]
  });
  const courier1 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier1@example.com", firstname: "Hà", lastname: "Trần Thị", phone: "988162751", address: "121 Main St" }]
  });
  const courier2 = await prisma.courier.createMany({
    data: [{ status_id: 2, email: "courier2@example.com", firstname: "Lợi", lastname: "Lê Văn", phone: "988162752", address: "122 Main St" }]
  });
  const courier3 = await prisma.courier.createMany({
    data: [{ status_id: 3, email: "courier3@example.com", firstname: "Hùng", lastname: "Trần Văn Hùng", phone: "988162754", address: "123 Main St" }]
  });
  const courier4 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier4@example.com", firstname: "Mai", lastname: "Lê Thị Thảo", phone: "988162755", address: "124 Main St" }]
  });
  const courier5 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier5@example.com", firstname: "Nga", lastname: "Đỗ Thị", phone: "988162756", address: "125 Main St" }]
  });
  const courier6 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier6@example.com", firstname: "Hậu", lastname: "Trần Công Hậu", phone: "988162757", address: "126 Main St" }]
  });
  const courier7 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier7@example.com", firstname: "Vinh", lastname: "Mai Quốc", phone: "988162758", address: "127 Main St" }]
  });
  const courier8 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier8@example.com", firstname: "Hồng", lastname: "Phan Thị", phone: "988162759", address: "128 Main St" }]
  });
  const courier9 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier9@example.com", firstname: "Duy", lastname: "Lê Hồng", phone: "988162710", address: "129 Main St" }]
  });
  const courier10 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier10@example.com", firstname: "Bảo", lastname: "Trần Văn", phone: "988162711", address: "130 Main St" }]
  });
  const courier11 = await prisma.courier.createMany({
    data: [{ status_id: 1, email: "courier11@example.com", firstname: "Cường", lastname: "Lê Văn", phone: "988162712", address: "131 Main St" }]
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
