import { Injectable, OnModuleInit } from "@nestjs/common";
import { prisma } from "@/src/utils";

@Injectable()
export class PrismaService implements OnModuleInit {
  async onModuleInit() {
    await prisma.$connect();
  }
}
