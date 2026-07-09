import { Injectable } from "@nestjs/common";
import { CreateCourierDto, UpdateCourierDto } from "./dto";
import { prisma } from "@/src/utils";

@Injectable()
export class CourierService {
  create(createCourierDto: CreateCourierDto) {
    return prisma.courier.create({
      data: {
        status_id: createCourierDto.status_id ? createCourierDto.status_id : undefined,
        email: createCourierDto.email ? createCourierDto.email : "",
        password: createCourierDto.password ? createCourierDto.password : "",
        firstname: createCourierDto.firstname ? createCourierDto.firstname : "",
        lastname: createCourierDto.lastname ? createCourierDto.lastname : "",
        phone: createCourierDto.phone ? createCourierDto.phone : "",
        address: createCourierDto.address ? createCourierDto.address : ""
      }
    });
  }

  findAll() {
    return prisma.courier.findMany();
  }

  findOne(id: number) {
    return prisma.courier.findFirst();
  }

  update(id: number, updateCourierDto: UpdateCourierDto) {
    return prisma.courier.update({
      where: { id },
      data: {
        status_id: updateCourierDto.status_id ? updateCourierDto.status_id : undefined,
        email: updateCourierDto.email ? updateCourierDto.email : "",
        password: updateCourierDto.password ? updateCourierDto.password : "",
        firstname: updateCourierDto.firstname ? updateCourierDto.firstname : "",
        lastname: updateCourierDto.lastname ? updateCourierDto.lastname : "",
        phone: updateCourierDto.phone ? updateCourierDto.phone : "",
        address: updateCourierDto.address ? updateCourierDto.address : ""
      }
    });
  }

  remove(id: number) {
    return prisma.courier.delete({ where: { id } });
  }
}
