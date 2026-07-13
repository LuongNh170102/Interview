import { PartialType } from "@nestjs/swagger";
import { CreateCourierDto } from "./create-courier.dto";

class UpdateCourierDto extends PartialType(CreateCourierDto) {}
export { UpdateCourierDto };
