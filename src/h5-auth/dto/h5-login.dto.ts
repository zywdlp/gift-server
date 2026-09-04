import { Matches } from "class-validator";

export class H5LoginDto {
  @Matches(/^1[3-9]\d{9}$/, { message: "请输入正确的中国大陆手机号" })
  phone: string;

  @Matches(/^\d{6}$/, { message: "短信验证码必须为 6 位数字" })
  code: string;
}
