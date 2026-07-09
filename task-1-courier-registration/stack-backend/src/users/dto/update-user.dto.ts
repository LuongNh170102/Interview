import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";

class UpdateUserDto extends PartialType(CreateUserDto) {}
export { UpdateUserDto };
