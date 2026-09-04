import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@/common/decorators/auth.decorator";
import { H5CardService } from "./h5-card.service";

@Public()
@ApiTags("H5.扫码")
@Controller("h5/cards")
export class H5CardController {
  constructor(private readonly h5CardService: H5CardService) {}

  @Get("by-token/:token")
  @ApiOperation({ summary: "扫码查询礼品卡与商品快照" })
  getByToken(@Param("token") token: string) {
    return this.h5CardService.getByToken(token);
  }
}
