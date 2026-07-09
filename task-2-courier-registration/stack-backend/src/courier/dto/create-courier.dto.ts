import { IsEmail, IsEmpty, IsNotEmpty } from "class-validator";

class CreateCourierDto {
  status_id: number | undefined;

  @IsEmail()
  email: string | undefined;

  @IsNotEmpty()
  password: string | undefined;

  @IsNotEmpty()
  firstname: string | undefined;

  @IsNotEmpty()
  lastname: string | undefined;

  @IsNotEmpty()
  phone: string | undefined;

  @IsNotEmpty()
  address: string | undefined;
}
export { CreateCourierDto };
