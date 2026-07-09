import { IsNotEmpty } from "class-validator";
class CreateAuthDto {
  @IsNotEmpty()
  token: string;
}
export { CreateAuthDto };
