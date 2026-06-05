import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectCourierDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  rejectionReason!: string;
}
