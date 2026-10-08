import { IsNotEmpty } from "class-validator";

class CreateOrdersDto {
  @IsNotEmpty()
  customerName?: string;

  @IsNotEmpty()
  customerPhone?: string;

  @IsNotEmpty()
  customerEmail?: string;

  @IsNotEmpty()
  customerAddress?: string;

  @IsNotEmpty()
  ordersProductJson?: string;
}
export { CreateOrdersDto };
