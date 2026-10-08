import { Injectable, Query } from "@nestjs/common";
import { CreateOrdersDto, OrdersQuery, UpdateOrdersDto } from "./dto";
import { prisma } from "@/src/utils";

@Injectable()
export class OrdersService {
  create(createOrdersDto: CreateOrdersDto) {
    const productLst: any[] = JSON.parse(createOrdersDto.ordersProductJson ?? "");
    const ordersDetail: any[] = [];
    if (productLst.length > 0) {
      for (var i = 0; i < productLst.length; i++) {
        let ordersDetailtem: any = {
          productId: productLst[i].id,
          productSku: productLst[i].sku,
          productName: productLst[i].productName,
          productFeaturedImage: productLst[i].featuredImage,
          productPrice: productLst[i].price,
          quantity: productLst[i].quantity,
          amount: productLst[i].amount
        };
        ordersDetail.push(ordersDetailtem);
      }
    }
    let sku: string = "";
    const characters = "123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < charactersLength) {
      sku += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return prisma.orders.create({
      data: {
        ordersCode: sku,
        ordersDate: new Date(),
        customerName: createOrdersDto.customerName ?? "",
        customerPhone: createOrdersDto.customerPhone ?? "",
        customerEmail: createOrdersDto.customerEmail ?? "",
        customerAddress: createOrdersDto.customerAddress ?? "",
        ordersDetail: {
          create: ordersDetail
        }
      }
    });
  }

  findAll = async (query: OrdersQuery) => {
    let where = {};
    if (query.ordersCode) {
      where["ordersCode"] = { contains: query.ordersCode };
    }
    if (query.customerName) {
      where["customerName"] = { contains: query.customerName };
    }
    if (query.customerPhone) {
      where["customerPhone"] = { contains: query.customerPhone };
    }
    if (query.ordersStartDate && query.ordersEndDate) {
      let startDate: Date = new Date(`${query.ordersStartDate}`);
      let endDate: Date = new Date(`${query.ordersEndDate}`);
      where["ordersDate"] = { gt: startDate, lt: endDate };
    }
    let page: number = query.page ? query.page : 0;
    let limit: number = query.limit ? query.limit : 0;
    const skip: number = (page - 1) * limit;
    const total: number = await prisma.orders.count({ where });
    const orders: any = await prisma.orders.findMany({
      where,
      select: {
        id: true,
        ordersCode: true,
        customerName: true,
        customerPhone: true,
        ordersDate: true
      },
      skip,
      take: query.limit ? parseInt(query.limit.toString()) : 10
    });
    return { orders, total };
  };

  findOne(id: number) {
    return prisma.orders.findFirst();
  }

  update(id: number, updateOrdersDto: UpdateOrdersDto) {
    return prisma.orders.update({
      where: { id },
      data: {
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
  truncate = async () => {
    await prisma.ordersDetail.deleteMany({});
    return prisma.orders.deleteMany({});
  };
  getDetail = (id: number) => {
    return prisma.orders.findUnique({
      where: { id },
      select: {
        id: true,
        ordersCode: true,
        ordersDate: true,
        ordersDetail: {
          select: {
            productSku: true,
            productName: true,
            productFeaturedImage: true,
            productPrice: true,
            quantity: true,
            amount: true
          }
        },
        customerName: true,
        customerPhone: true
      }
    });
  };
}
