import { IsString, Matches, MaxLength } from "class-validator";

export class VerifyPinDto {
  @IsString()
  @MaxLength(255)
  cardToken: string;

  @Matches(/^\d{6}$/, { message: "兑换密码必须为 6 位数字" })
  pin: string;
}
