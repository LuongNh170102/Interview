import { IsNotEmpty } from "class-validator";

class OrdersQuery {
  ordersCode?: string;
  customerName?: string;
  customerPhone?: string;
  ordersStartDate?: Date;
  ordersEndDate?: Date;
  @IsNotEmpty()
  page?: number;
  @IsNotEmpty()
  limit?: number;
}
export { OrdersQuery };
