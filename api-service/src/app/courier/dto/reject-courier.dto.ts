import { IsNotEmpty, IsString } from 'class-validator';

export class RejectCourierDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}