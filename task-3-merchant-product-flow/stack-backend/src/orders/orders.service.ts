import { Injectable } from "@nestjs/common";
import { CreateOrdersDto, UpdateOrdersDto } from "./dto";
import { prisma } from "@/src/utils";

@Injectable()
export class OrdersService {
  create(createOrdersDto: CreateOrdersDto) {
    return prisma.orders.create({
      data: {
        ordersCode: createOrdersDto.ordersCode ?? "",
        ordersDate: createOrdersDto.ordersDate ?? "",
        customerName: createOrdersDto.customerName ?? "",
        customerPhone: createOrdersDto.customerPhone ?? "",
        customerEmail: createOrdersDto.customerEmail ?? "",
        customerAddress: createOrdersDto.customerAddress ?? ""
      }
    });
  }

  findAll() {
    return prisma.orders.findMany();
  }

  findOne(id: number) {
    return prisma.orders.findFirst();
  }

  update(id: number, updateOrdersDto: UpdateOrdersDto) {
    return prisma.orders.update({
      where: { id },
      data: {
        ordersCode: updateOrdersDto.ordersCode ?? "",
        ordersDate: updateOrdersDto.ordersDate ?? "",
        customerName: updateOrdersDto.customerName ?? "",
        customerPhone: updateOrdersDto.customerPhone ?? "",
        customerEmail: updateOrdersDto.customerEmail ?? "",
        customerAddress: updateOrdersDto.customerAddress ?? ""
      }
    });
  }

  remove(id: number) {
    return prisma.orders.delete({ where: { id } });
  }
}
