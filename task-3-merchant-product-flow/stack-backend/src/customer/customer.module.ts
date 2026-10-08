import { PrismaModule } from "@/src/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { CustomerController } from "./customer.controller";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (confService: ConfigService) => ({
        secret: confService.get<string>("JWT_ACCESS_TOKEN_SECRET")
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [CustomerController],
  providers: [CustomerService]
})
export class CustomerModule {}
