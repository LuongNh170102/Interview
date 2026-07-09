import { IsEmail, IsNotEmpty } from "class-validator";

class QueryUserDto {
  username: string;
  email: string;
  role: string;
}
export { QueryUserDto };
