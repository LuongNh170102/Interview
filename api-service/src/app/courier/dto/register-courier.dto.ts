import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class RegisterCourierDto {
  @IsPhoneNumber('VN')
  phone: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class RejectCourierDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
