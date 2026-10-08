import { IsNotEmpty } from "class-validator";
class CreateCustomerDto {
  @IsNotEmpty()
  fullname?: string;

  @IsNotEmpty()
  mobile?: string;

  @IsNotEmpty()
  email?: string;

  @IsNotEmpty()
  password?: string;
}
export { CreateCustomerDto };
