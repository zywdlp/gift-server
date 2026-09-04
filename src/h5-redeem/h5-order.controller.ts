import { Controller, Get, Param, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { H5RedeemService } from "./h5-redeem.service";

@ApiTags("H5.订单")
@Controller("h5/orders")
export class H5OrderController {
  constructor(private readonly h5RedeemService: H5RedeemService) {}

  @Get()
  @ApiOperation({ summary: "查询当前用户的兑换订单" })
  getOrders(@Req() req: any) {
    return this.h5RedeemService.getOrders(String(req.user?.h5UserId || ""));
  }

  @Get(":orderNo")
  @ApiOperation({ summary: "查询当前用户的兑换订单详情" })
  getOrderDetail(@Req() req: any, @Param("orderNo") orderNo: string) {
    return this.h5RedeemService.getOrderDetail(String(req.user?.h5UserId || ""), orderNo);
  }
}
