import { IsNotEmpty } from "class-validator";

class CreateStatusDto {
  @IsNotEmpty()
  tag_name: string | undefined;
}
export { CreateStatusDto };
