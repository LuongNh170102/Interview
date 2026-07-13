import { PartialType } from "@nestjs/swagger";
import { CreateMediaFileDto } from "./create-media-file.dto";

class UpdateMediaFileDto extends PartialType(CreateMediaFileDto) {}
export { UpdateMediaFileDto };
