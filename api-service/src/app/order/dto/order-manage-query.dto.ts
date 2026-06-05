import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class OrderManageQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  merchantId?: string;
}
