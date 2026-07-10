import { IsNotEmpty } from "class-validator";

class QueryDto {
  @IsNotEmpty()
  token?: string;
}
export { QueryDto };
