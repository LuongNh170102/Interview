import { CustomerService } from "./customer.service";

import { Public, ResponseMessage } from "@/src/decorator";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { CreateCustomerDto, LoginCustomerDto } from "./dto";

@Controller("customer")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Public()
  @ResponseMessage("Register successfully")
  @Post("create")
  register(@Body() createCustomer: CreateCustomerDto) {
    return this.customerService.create(createCustomer);
  }

  @Public()
  @ResponseMessage("Login successfully")
  @Post("login")
  login(@Body() loginCustomer: LoginCustomerDto) {
    return this.customerService.login(loginCustomer);
  }
}
