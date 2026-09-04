import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@/common/decorators/auth.decorator";
import { H5LoginDto } from "./dto/h5-login.dto";
import { SendSmsDto } from "./dto/send-sms.dto";
import { H5AuthService } from "./h5-auth.service";

@Public()
@ApiTags("H5.登录")
@Controller("h5")
export class H5AuthController {
  constructor(private readonly h5AuthService: H5AuthService) {}

  @Post("sms/send")
  @ApiOperation({ summary: "发送 H5 短信验证码" })
  sendSms(@Body() dto: SendSmsDto) {
    return this.h5AuthService.sendSms(dto.phone);
  }

  @Post("auth/login")
  @ApiOperation({ summary: "H5 短信验证码登录" })
  login(@Body() dto: H5LoginDto) {
    return this.h5AuthService.login(dto);
  }
}
