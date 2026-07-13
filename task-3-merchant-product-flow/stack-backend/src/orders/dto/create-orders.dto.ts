import { IsNotEmpty } from "class-validator";

class CreateOrdersDto {
  @IsNotEmpty()
  id?: number;

  @IsNotEmpty()
  ordersCode?: string;

  @IsNotEmpty()
  ordersDate?: Date;

  @IsNotEmpty()
  customerName?: string;

  @IsNotEmpty()
  customerPhone?: string;

  @IsNotEmpty()
  customerEmail?: string;

  @IsNotEmpty()
  customerAddress?: string;
}
export { CreateOrdersDto };
