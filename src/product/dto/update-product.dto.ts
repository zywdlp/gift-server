import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateProductDto {
  @ApiPropertyOptional({ description: "商品名称" }) @IsOptional() @IsString() @MaxLength(100)
  name?: string;
  @ApiPropertyOptional({ description: "商品简称" }) @IsOptional() @IsString() @MaxLength(100)
  shortName?: string | null;
  @ApiPropertyOptional({ description: "商品主图地址" }) @IsOptional() @IsString() @MaxLength(500)
  coverImage?: string | null;
  @ApiPropertyOptional({ description: "商品详情图片地址列表", type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(500, { each: true })
  detailImages?: string[];
  @ApiPropertyOptional({ description: "参考价值" }) @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  referenceValue?: number | null;
  @ApiPropertyOptional({ description: "商品详情" }) @IsOptional() @IsString()
  description?: string | null;
  @ApiPropertyOptional({ description: "配送范围" }) @IsOptional() @IsString()
  deliveryScope?: string | null;
  @ApiPropertyOptional({ description: "售后说明" }) @IsOptional() @IsString()
  afterSales?: string | null;
}
