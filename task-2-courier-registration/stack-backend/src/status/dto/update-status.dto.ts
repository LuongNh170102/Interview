import { PartialType } from '@nestjs/swagger';
import { CreateStatusDto } from './create-status.dto';
class UpdateStatusDto extends PartialType(CreateStatusDto) {}
export { UpdateStatusDto };
