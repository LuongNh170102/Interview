import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { CourierService } from "./courier.service";
import { CreateCourierDto, UpdateCourierDto } from "./dto";

@Controller("courier")
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Post("create")
  create(@Body() createCourierDto: CreateCourierDto) {
    return this.courierService.create(createCourierDto);
  }

  @Get("list")
  findAll() {
    return this.courierService.findAll();
  }

  @Get("detail/:id")
  findOne(@Param("id") id: string) {
    return this.courierService.findOne(+id);
  }

  @Post("update/:id")
  update(@Param("id") id: string, @Body() updateCourierDto: UpdateCourierDto) {
    return this.courierService.update(id, updateCourierDto);
  }

  @Delete("delete/:id")
  remove(@Param("id") id: string) {
    return this.courierService.remove(id);
  }
}
