import { IsOptional, IsString, IsEnum } from 'class-validator';

export class ApproveCourierDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  reason?: string; 
}
