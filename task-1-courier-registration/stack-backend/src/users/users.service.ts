import { getHashPassword, prisma } from "@/src/utils";
import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto";
@Injectable()
export class UsersService {
  constructor() {}
  create = (createUserDto: CreateUserDto) => {
    return prisma.user.create({
      data: {
        username: createUserDto.username,
        password: getHashPassword(createUserDto.password),
        fullname: createUserDto.fullname,
        email: createUserDto.email,
        phone: createUserDto.phone
      }
    });
  };
  
}
