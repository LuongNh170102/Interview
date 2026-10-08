import { IsNotEmpty } from "class-validator";
class LoginCustomerDto {
  @IsNotEmpty()
  username?: string;

  @IsNotEmpty()
  password?: string;
}
export { LoginCustomerDto };
