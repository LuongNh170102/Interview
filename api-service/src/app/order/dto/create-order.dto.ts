import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class DeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  receiverName?: string;

  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  latitude!: number

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  longitude!: number
}

export class OrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  productId!: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  variantId?: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  merchantId!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  courierId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  promotionId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    return value;
  })
  deliveryAddress?: DeliveryAddressDto;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  products!: OrderItemDto[];
}
