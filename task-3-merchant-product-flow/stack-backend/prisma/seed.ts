import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const productList = await prisma.product.createMany({
    data: [
      { sku: "LTAS26", productName: "LAPTOP ASUS VIVOBOOK X1404VAP (CORE 5 120U / RAM 8GB / SSD 256GB / 14' FHD / WIN11 / BLUE)_N", price: 13790000, featuredImage: "LTAS26.jpg" },
      {
        sku: "LTAS42",
        productName: "LAPTOP ASUS VIVOBOOK 14 M1405NAQ-LY010W (AMD RYZEN 5 150 | 16GB | 512GB | AMD RADEON | 14 INCH WUXGA | WIN 11 | BẠC)",
        price: 17590000,
        featuredImage: "LTAS42.png"
      },
      { sku: "LTHP13", productName: "LAPTOP HP 15 - FD0133WM ( INTEL CORE I3.1315U / RAM 8GB / SSD 256GB / 15.6INCH FHD / WIN 11 / SILVER _B4KT4UA )", price: 12590000, featuredImage: "LTHP13.jpg" },
      { sku: "LTDE04", productName: "LAPTOP DELL 15 DC15250 I5-1334U/8GB/512GB SSD/15.6 FHD/ DOS/ CARBON BLACK_N", price: 14790000, featuredImage: "LTDE04.jpg" },
      {
        sku: "LTAC02",
        productName: "ACER GAMING ASPIRE 7 A715-59G-59RD NH.DXUSV.001 (CORE™ 5 210H | 16GB | 512GB | RTX 3050 4GB | 15.6 INCH FHD 144HZ | WIN 11 | ĐEN)",
        price: 25990000,
        featuredImage: "LTAC02.jpg"
      },
      {
        sku: "LTDE40",
        productName: "LAPTOP DELL 15 DC15250, I5-1334U, 16GB DDR5, 512GB SSD, INTEL GRAPHICS, 15.6 INCH FHD, 3C 41WH, AX+BT, OFFICEHS24+365, MCAFEE LS, WIN 11 HOME, BẠC (PLATINUM SILVER)",
        price: 24950000,
        featuredImage: "LTDE40.jpg"
      },
      { sku: "LTAS32", productName: "LAPTOP ASUS VIVOBOOK X1404VAP (CORE 5 120U / RAM 16GB / SSD 256GB / 14 FHD / WIN11 / BLUE)_ NK UP16G", price: 14990000, featuredImage: "LTAS32.jpg" },
      {
        sku: "LTAS44",
        productName: "LAPTOP ASUS GAMING V16 V3607VU-RP343W (INTEL CORE 5 210H | RTX 4050 6GB | 16 INCH WUXGA 144HZ | 16GB | 512GB | WIN 11 | ĐEN)",
        price: 25290000,
        featuredImage: "LTAS44.jpg"
      },
      {
        sku: "LTLE20",
        productName: "LAPTOP LENOVO THINKBOOK 16 G7 ARP (21MW009QSA) AMD RYZEN 7 7735HS, 16GB, 512GB, AMD RADEON 680M, 16 WUXGA, DOS, ARCTIC GREY, NK",
        price: 19490000,
        featuredImage: "LTLE20.jpg"
      },
      {
        sku: "LTDE18",
        productName: "DELL 15 DC15250 CORE™ I5-1334U/ 512GB SSD/ 8GB DDR4/ 15.6 (1920X1080) TOUCHSCREEN/ WIN11 S-MODE/ CARBON BLACK _NK",
        price: 15990000,
        featuredImage: "LTDE18.jpg"
      },
      {
        sku: "LTAS14",
        productName: "Laptop ASUS Zenbook 14 UX3405CA-ST628W (Intel Core Ultra 5 225H | 16GB | 512GB SSD | Intel Arc Graphics | 14.0 3K OLED | Windows 11 | Xanh)",
        price: 28790000,
        featuredImage: "LTAS14.png"
      },
      { sku: "LTDE31", productName: "LAPTOP DELL DC15250-7982BLK (I7-1355U, 16GB DDR4, 1TB NVME, 15.6 FHD TOUCH, WIN 11, BLACK", price: 20990000, featuredImage: "LTDE31.png" },
      {
        sku: "LTAS40",
        productName: "Laptop ASUS Vivobook S14 S3407AA-SF945W (Intel Core Ultra 5 325 | 16GB | 512GB | Intel Arc | 14 WUXGA OLED | Win 11 | Xám)",
        price: 28790000,
        featuredImage: "LTAS40.png"
      },
      { sku: "LTAS41", productName: "Laptop ASUS Vivobook Go 15 E1504FA-BQ340W (Ryzen 5 40 | 16GB | 512GB | AMD Radeon | 15.6 inch FHD | Win 11 | Bạc)", price: 18190000, featuredImage: "LTAS41.png" },
      {
        sku: "LTLE21",
        productName: "LAPTOP GAMING LENOVO LOQ -15IAX9E/ 83LK0079VN (CORE I5 12450HX | 16GB DDR5 | SSD 512GB | RTX 3050 6GB GDDR6 | 15.6 FHD 144HZ  | WIN 11)",
        price: 23990000,
        featuredImage: "LTLE21.jpg"
      },
      {
        sku: "LTLE22",
        productName: "LAPTOP LENOVO LOQ Essential -15IAX9E (CORE I5-12450HX | 16GB | 512GB | RTX 3050 6GB  | 15.6 FHD 144HZ | WIN 11 | LUNA GREY) NK",
        price: 20890000,
        featuredImage: "LTLE22.jpg"
      },
      {
        sku: "LTDE06",
        productName: "Laptop Dell Pro 15 Essential PV15250 VKVKD (Core 3-100U | 8GB | 512GB SSD | 15.6 FHD | Intel Graphics | Ubuntu | Black)",
        price: 12590000,
        featuredImage: "LTDE06.jpg"
      },
      {
        sku: "LTLE36",
        productName: "LAPTOP LENOVO IDEAPAD SLIM 3 14IRH10 83K00009VN (INTEL CORE I7-13620H | 24GB | 512GB | INTEL UHD | 14 INCH WUXGA IPS | WIN 11 | XÁM)",
        price: 23990000,
        featuredImage: "LTLE36.jpg"
      },
      {
        sku: "LTAS45",
        productName: "LAPTOP ASUS GAMING V16 V3607VJ-RP071W ( INTEL CORE 5 210H | RTX 3050 6GB | 16 INCH WUXGA | 16GB | 512GB | WIN 11 | ĐEN)",
        price: 24690000,
        featuredImage: "LTAS45.jpg"
      },
      {
        sku: "LTHP04",
        productName: "Laptop HP 14 - ep1179TU C89ZSPA (Intel Core 5 120U | 16GB | 512GB | Intel Graphics | 14 inch FHD | Win 11 | Bạc)",
        price: 22290000,
        featuredImage: "LTHP04.jpg"
      },
      {
        sku: "LTAS01",
        productName: "Laptop Gaming ASUS TUF A15 FA506NCG-HN184W (AMD Ryzen 7 7445HS | RTX 3050 4GB | 16GB | 512GB SSD | 15.6 FHD 144Hz | Win11 | Đen)",
        price: 22390000,
        featuredImage: "LTAS01.jpg"
      },
      {
        sku: "LTDE24",
        productName: "LAPTOP DELL 15 DC15250 DC5I7952W1 (INTEL CORE I7-1355U | 16GB | 512GB | INTEL GRAPHICS | 15.6 INCH FHD IPS | WIN 11 | OFFICEHOME24 | OS365 | BẠC)",
        price: 24190000,
        featuredImage: "LTDE24.png"
      },
      {
        sku: "LTDE29",
        productName: "Laptop Dell 14 DC14250 C7U161W11SLU (Intel Core i7-150U | 16GB | 1TB | Intel Graphics | 14 1920×1200 | Win 11 | Office | Bạc)",
        price: 27890000,
        featuredImage: "LTDE29.png"
      },
      { sku: "LTAS02", productName: "Laptop ASUS Gaming V16 V3607VM-RP044W (Core™ 7 240H | 16GB | 1TB | RTX 5060 | 16inch WUXGA 144Hz | Win 11 | Đen)", price: 34450000, featuredImage: "LTAS02.jpg" }
    ]
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
