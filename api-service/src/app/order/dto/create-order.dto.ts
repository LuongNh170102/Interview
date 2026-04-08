import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeliveryAddressDto {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  /**
   * Latitude of the delivery location.
   * Used for nearest-courier selection logic.
   */
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  /**
   * Longitude of the delivery location.
   * Used for nearest-courier selection logic.
   */
  @IsNotEmpty()
  @IsNumber()
  lng: number;
}

export class OrderItemDto {
  /**
   * externalId of the product (never internal integer ID).
   */
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  /**
   * Optional: variant externalId for products with size/color variants.
   */
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class CreateOrderDto {
  /**
   * externalId of the merchant to order from.
   */
  @IsNotEmpty()
  @IsString()
  merchantId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
