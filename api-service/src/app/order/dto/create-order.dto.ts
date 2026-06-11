import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  deliveryAddress: string;

  @IsOptional()
  @IsObject()
  coordinates?: {
    lat: number;
    lng: number;
  };
}
