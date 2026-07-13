import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./users/users.module";
import { ProductModule } from './product/product.module';
import { MediaFileModule } from './media-file/media-file.module';
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
    ProductModule,
    MediaFileModule
  ]
})
export class AppModule {}
