import { IsNotEmpty } from "class-validator";

class CreateOrderDto {
  @IsNotEmpty()
  id: number | undefined;

  @IsNotEmpty()
  courier_id: number | undefined;

  @IsNotEmpty()
  courier_firstname: string | undefined;

  @IsNotEmpty()
  courier_lastname: string | undefined;

  @IsNotEmpty()
  order_sku: string | undefined;

  @IsNotEmpty()
  order_date: string | undefined;

  @IsNotEmpty()
  customer_name: string | undefined;

  @IsNotEmpty()
  customer_phone: string | undefined;

  @IsNotEmpty()
  customer_address: string | undefined;
}
export { CreateOrderDto };
