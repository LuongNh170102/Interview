import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CreateProductDto, UpdateProductDto } from "./dto";
import { ProductService } from "./product.service";
@Controller("product")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post("create")
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get("list")
  findAll() {
    return this.productService.findAll();
  }

  @Get("detail/:id")
  findOne(@Param("id") id: string) {
    return this.productService.findOne(id);
  }

  @Post("update/:id")
  update(@Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productService.remove(id);
  }
}
