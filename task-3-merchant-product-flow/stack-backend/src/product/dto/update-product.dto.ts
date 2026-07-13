import { PartialType } from "@nestjs/swagger";
import { CreateProductDto } from "./create-product.dto";

class UpdateProductDto extends PartialType(CreateProductDto) {}
export { UpdateProductDto };
