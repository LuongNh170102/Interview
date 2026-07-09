import { PartialType } from "@nestjs/mapped-types";
import { CreateAuthDto } from "./create-auth.dto";

class UpdateAuthDto extends PartialType(CreateAuthDto) {}
export { UpdateAuthDto };
