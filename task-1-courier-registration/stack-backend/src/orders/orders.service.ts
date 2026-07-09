import { Injectable } from "@nestjs/common";
import { CreateOrderDto, UpdateOrderDto } from "./dto";
import { prisma } from "@/src/utils";

@Injectable()
export class OrdersService {
  create(createOrderDto: CreateOrderDto) {
    return prisma.orders.create({
      data: {
        courier_id: createOrderDto.courier_id ? createOrderDto.courier_id : 0,
        courier_firstname: createOrderDto.courier_firstname ? createOrderDto.courier_firstname : "",
        courier_lastname: createOrderDto.courier_lastname ? createOrderDto.courier_lastname : "",
        order_sku: createOrderDto.order_sku ? createOrderDto.order_sku : "",
        order_date: createOrderDto.order_date ? createOrderDto.order_date : "",
        customer_name: createOrderDto.customer_name ? createOrderDto.customer_name : "",
        customer_phone: createOrderDto.customer_phone ? createOrderDto.customer_phone : "",
        customer_address: createOrderDto.customer_address ? createOrderDto.customer_address : ""
      }
    });
  }

  findAll() {
    return prisma.orders.findMany();
  }

  findOne(id: number) {
    return prisma.orders.findFirst();
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return prisma.orders.update({
      where: { id },
      data: {
        courier_id: updateOrderDto.courier_id ? updateOrderDto.courier_id : 0,
        courier_firstname: updateOrderDto.courier_firstname ? updateOrderDto.courier_firstname : "",
        courier_lastname: updateOrderDto.courier_lastname ? updateOrderDto.courier_lastname : "",
        order_sku: updateOrderDto.order_sku ? updateOrderDto.order_sku : "",
        order_date: updateOrderDto.order_date ? updateOrderDto.order_date : "",
        customer_name: updateOrderDto.customer_name ? updateOrderDto.customer_name : "",
        customer_phone: updateOrderDto.customer_phone ? updateOrderDto.customer_phone : "",
        customer_address: updateOrderDto.customer_address ? updateOrderDto.customer_address : ""
      }
    });
  }

  remove(id: number) {
    return prisma.orders.delete({ where: { id } });
  }
}
