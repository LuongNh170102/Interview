import { prisma } from "@/src/utils";
import { Injectable } from "@nestjs/common";
import { CreateStatusDto, UpdateStatusDto } from "./dto";
@Injectable()
export class StatusService {
  create(createStatusDto: CreateStatusDto) {
    return prisma.status.create({
      data: {
        tag_name: createStatusDto.tag_name ? createStatusDto.tag_name : ""
      }
    });
  }

  findAll() {
    return prisma.status.findMany();
  }

  findOne(id: number) {
    return prisma.status.findFirst();
  }

  update(id: number, updateStatusDto: UpdateStatusDto) {
    return prisma.status.update({ where: { id }, data: { tag_name: updateStatusDto.tag_name ? updateStatusDto.tag_name : "" } });
  }

  remove(id: number) {
    return prisma.status.delete({ where: { id } });
  }
}
