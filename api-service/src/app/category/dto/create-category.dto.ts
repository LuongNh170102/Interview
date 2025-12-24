import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LocalizedStringDto {
  @IsString()
  @IsNotEmpty()
  vi: string;

  @IsString()
  @IsOptional()
  en?: string;

  @IsString()
  @IsOptional()
  ko?: string;
}

export class CreateCategoryDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  parentId?: number;

  @IsOptional()
  @IsString()
  slug?: string;
}
