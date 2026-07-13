import { Injectable } from "@nestjs/common";
import { CreateCourierDto, UpdateCourierDto } from "./dto";
import { prisma } from "@/src/utils";

@Injectable()
export class CourierService {
  create(createCourierDto: CreateCourierDto) {
    return prisma.courier.create({
      data: {
        status_id: createCourierDto.status_id ? parseInt(createCourierDto.status_id.toString()) : undefined,
        email: createCourierDto.email ? createCourierDto.email : "",
        firstname: createCourierDto.firstname ? createCourierDto.firstname : "",
        lastname: createCourierDto.lastname ? createCourierDto.lastname : "",
        phone: createCourierDto.phone ? createCourierDto.phone : "",
        address: createCourierDto.address ? createCourierDto.address : ""
      }
    });
  }

  findAll = async () => {
    let couriers = await prisma.courier.findMany();
    let total = await prisma.courier.count();
    return {
      couriers,
      total
    };
  };

  findOne(id: number) {
    return prisma.courier.findUnique({ where: { id } });
  }

  update(id: string, updateCourierDto: UpdateCourierDto) {
    return prisma.courier.update({
      where: { id: id ? parseInt(id) : 0 },
      data: {
        status_id: updateCourierDto.status_id ? updateCourierDto.status_id : undefined,
        email: updateCourierDto.email ? updateCourierDto.email : "",
        firstname: updateCourierDto.firstname ? updateCourierDto.firstname : "",
        lastname: updateCourierDto.lastname ? updateCourierDto.lastname : "",
        phone: updateCourierDto.phone ? updateCourierDto.phone : "",
        address: updateCourierDto.address ? updateCourierDto.address : ""
      }
    });
  }

  remove(id: string) {
    return prisma.courier.delete({ where: { id: id ? parseInt(id) : 0 } });
  }
}
