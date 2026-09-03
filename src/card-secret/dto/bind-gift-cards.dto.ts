import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class BindGiftCardsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @IsString({ each: true })
  cardIds: string[];

  @Type(() => String)
  @IsString()
  productId: string;

  @IsDateString()
  expiryAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}
