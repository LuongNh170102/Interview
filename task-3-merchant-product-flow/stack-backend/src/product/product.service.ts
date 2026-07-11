import { prisma } from "@/src/utils";
import { Injectable } from "@nestjs/common";
import { CreateProductDto, UpdateProductDto } from "./dto";
@Injectable()
export class ProductService {
  create(createProductDto: CreateProductDto) {
    return prisma.product.create({
      data: {
        sku: createProductDto.sku ?? "",
        productName: createProductDto.productName ?? "",
        price: createProductDto.price ? parseFloat(createProductDto.price.toString()) : 0,
        featuredImage: createProductDto.featuredImage ?? ""
      }
    });
  }

  findAll = async () => {
    let productList = await prisma.product.findMany();
    let total = await prisma.product.count();
    return {
      productList,
      total
    };
  };

  findOne(id: string) {
    return prisma.product.findUnique({ where: { id: id ? parseInt(id) : 0 } });
  }

  update(id: string, updateProductDto: UpdateProductDto) {
    return prisma.product.update({
      where: { id: id ? parseInt(id) : 0 },
      data: { sku: updateProductDto.sku ?? "", productName: updateProductDto.productName ?? "", price: updateProductDto.price ?? 0, featuredImage: updateProductDto.featuredImage ?? "" }
    });
  }

  remove(id: string) {
    return prisma.product.delete({ where: { id: id ? parseInt(id) : 0 } });
  }
}
