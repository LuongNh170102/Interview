import { IsNotEmpty, IsString } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  code: string;
}
