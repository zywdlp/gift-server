import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { BaseQueryDto } from "@/common/dto/base-query.dto";

export class RedeemOrderQueryDto extends BaseQueryDto {
  @IsOptional() @IsString() @MaxLength(32) orderNo?: string;
  @IsOptional() @IsString() @MaxLength(32) cardNo?: string;
  @IsOptional() @IsString() @MaxLength(11) redeemerPhone?: string;
  @IsOptional() @IsString() @MaxLength(100) productName?: string;
  @IsOptional() @IsIn(["PENDING_SHIPMENT", "SHIPPED"]) status?: "PENDING_SHIPMENT" | "SHIPPED";
}
