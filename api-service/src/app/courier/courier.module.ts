import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CourierService } from './courier.service';
import { CourierController } from './courier.controller';
import { PrismaService } from '../prisma.service';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRATION') ||
            '1d') as any,
        },
      }),
      inject: [ConfigService],
    }),
    OtpModule,
  ],
  controllers: [CourierController],
  providers: [CourierService, PrismaService],
  exports: [CourierService],
})
export class CourierModule {}
