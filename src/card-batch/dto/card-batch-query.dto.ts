import { IsOptional, IsString, MaxLength } from "class-validator";
import { BaseQueryDto } from "@/common/dto/base-query.dto";

export class CardBatchQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keywords?: string;
}
