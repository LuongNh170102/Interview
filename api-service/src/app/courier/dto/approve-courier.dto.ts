import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectCourierDto {
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}
