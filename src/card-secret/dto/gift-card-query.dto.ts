import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { BaseQueryDto } from "@/common/dto/base-query.dto";

export class GiftCardQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  cardNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  batchNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  productName?: string;

  @IsOptional()
  @IsIn(["UNBOUND", "ACTIVE", "EXPIRED", "REDEEMED"])
  status?: "UNBOUND" | "ACTIVE" | "EXPIRED" | "REDEEMED";
}
