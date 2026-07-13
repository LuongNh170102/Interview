import { PartialType } from "@nestjs/swagger";
import { CreateOrderDto } from "./create-order.dto";

class UpdateOrderDto extends PartialType(CreateOrderDto) {}
export { UpdateOrderDto };
