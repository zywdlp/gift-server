import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";

export class GenerateCardSecretDto {
  @IsUUID()
  requestId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}
