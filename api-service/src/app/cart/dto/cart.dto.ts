import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class UpdateCartItemDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  itemId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;
}
