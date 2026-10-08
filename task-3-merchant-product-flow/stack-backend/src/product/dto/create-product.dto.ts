import { IsNotEmpty } from "class-validator";

class CreateProductDto {
  @IsNotEmpty()
  sku?: string;

  @IsNotEmpty()
  productName?: string;

  @IsNotEmpty()
  price?: number;

  featuredImage?: string;
}
export { CreateProductDto };
