import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrdersDto, OrdersQuery, UpdateOrdersDto } from "./dto";
import { Public, ResponseMessage } from "@/src/decorator";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post("create")
  create(@Body() createOrdersDto: CreateOrdersDto) {
    return this.ordersService.create(createOrdersDto);
  }

  @Get("list")
  getList(@Query() query: OrdersQuery) {
    return this.ordersService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateOrderDto: UpdateOrdersDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ordersService.remove(+id);
  }

  @Post("truncate")
  truncate() {
    return this.ordersService.truncate();
  }
  @Get("detail/:id")
  @ResponseMessage("Get orders detail")
  getDetail(@Param("id", ParseIntPipe) id: number) {
    return this.ordersService.getDetail(id);
  }
}
