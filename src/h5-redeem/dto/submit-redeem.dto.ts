import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateNested } from "class-validator";

class RedeemAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  recipient: string;

  @Matches(/^1[3-9]\d{9}$/, { message: "请输入正确的收件人手机号" })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  province: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  district: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  detail: string;
}

export class SubmitRedeemDto {
  @IsUUID("4", { message: "请求标识格式不正确" })
  requestId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  cardToken: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  redeemSessionToken: string;

  @ValidateNested()
  @Type(() => RedeemAddressDto)
  address: RedeemAddressDto;
}
