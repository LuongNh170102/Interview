import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CreateCustomerDto, LoginCustomerDto } from "./dto";
import { getHashPassword, prisma } from "@/src/utils";
import { compareSync } from "bcryptjs";
import { ICustomer } from "@/src/types";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
@Injectable()
export class CustomerService {
  constructor(
    private confService: ConfigService,
    private jwtService: JwtService
  ) {}
  create = (createCustomerDto: CreateCustomerDto) => {
    return prisma.customer.create({
      data: {
        fullname: createCustomerDto.fullname ?? "",
        mobile: createCustomerDto.mobile ?? "",
        email: createCustomerDto.email ?? "",
        password: getHashPassword(createCustomerDto.password ?? "")
      }
    });
  };
  login = async (loginCustomerDto: LoginCustomerDto) => {
    const customerItem: ICustomer | null = await prisma.customer.findFirst({
      where: {
        OR: [{ mobile: loginCustomerDto.username }, { email: loginCustomerDto.username }]
      }
    });
    if (!customerItem) {
      throw new UnauthorizedException("Customer not found");
    }
    if (!compareSync(loginCustomerDto.password, customerItem.password)) {
      throw new UnauthorizedException("Invalid username password");
    }
    const token: string = await this.jwtService.signAsync(
      {
        sub: customerItem.id,
        mobile: customerItem.mobile,
        email: customerItem.mobile
      },
      { secret: this.confService.get<string>("JWT_ACCESS_TOKEN_SECRET") }
    );
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(token, salt);
    await prisma.customer.update({
      where: {
        id: customerItem.id
      },
      data: {
        token: hashedRefreshToken
      }
    });
    return {
      id: customerItem.id,
      fullname: customerItem.fullname,
      mobile: customerItem.mobile,
      email: customerItem.email,
      token
    };
  };
}
