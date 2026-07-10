import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-users.dto";

class UpdateUserDto extends PartialType(CreateUserDto) {}
export { UpdateUserDto };
