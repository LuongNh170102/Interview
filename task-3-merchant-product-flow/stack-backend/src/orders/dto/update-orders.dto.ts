import { PartialType } from "@nestjs/swagger";
import { CreateOrdersDto } from "./create-orders.dto";

class UpdateOrdersDto extends PartialType(CreateOrdersDto) {}
export { UpdateOrdersDto };
