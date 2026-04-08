import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RejectCourierDto {
  /**
   * The reason for rejecting the courier. Required by business rule:
   * a courier must know WHY they were rejected so they can take corrective action
   * (e.g., upload correct license, fix phone number format).
   */
  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters.' })
  reason: string;
}
