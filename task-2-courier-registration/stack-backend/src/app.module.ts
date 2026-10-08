import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./users/users.module";
import { StatusModule } from "./status/status.module";
import { CourierModule } from "./courier/courier.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public")
    }),
    AuthModule,
    UserModule,
    StatusModule,
    CourierModule
  ]
})
export class AppModule {}
