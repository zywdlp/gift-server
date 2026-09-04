import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@/common/decorators/auth.decorator";
import { VerifyPinDto } from "./dto/verify-pin.dto";
import { H5RedeemService } from "./h5-redeem.service";
import { SubmitRedeemDto } from "./dto/submit-redeem.dto";

@ApiTags("H5.兑换")
@Controller("h5/redeem")
export class H5RedeemController {
  constructor(private readonly h5RedeemService: H5RedeemService) {}

  @Post("verify-pin")
  @Public()
  @ApiOperation({ summary: "验证礼品卡 PIN 并签发兑换会话" })
  verifyPin(@Body() dto: VerifyPinDto) {
    return this.h5RedeemService.verifyPin(dto);
  }

  @Post("submit")
  @ApiOperation({ summary: "提交礼品兑换" })
  submit(@Req() req: any, @Body() dto: SubmitRedeemDto) {
    return this.h5RedeemService.submit(dto, String(req.user?.h5UserId || ""));
  }

}
