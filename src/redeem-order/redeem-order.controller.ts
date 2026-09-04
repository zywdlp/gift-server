import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Log } from "@/common/decorators/log.decorator";
import { ActionTypeValue } from "@/common/enums/action-type.enum";
import { LogModuleValue } from "@/common/enums/log-module.enum";
import { AdminOnlyGuard } from "@/common/guards/admin-only.guard";
import { RedeemOrderQueryDto } from "./dto/redeem-order-query.dto";
import { RedeemOrderService } from "./redeem-order.service";

@ApiTags("订单管理")
@Controller("redeem-orders")
@UseGuards(AdminOnlyGuard)
export class RedeemOrderController {
  constructor(private readonly redeemOrderService: RedeemOrderService) {}
  @Get() @ApiOperation({ summary: "兑换订单分页列表" })
  getPage(@Query() query: RedeemOrderQueryDto) { return this.redeemOrderService.getPage(query); }
  @Post(":orderNo/ship") @ApiOperation({ summary: "确认订单发货" })
  @Log(LogModuleValue.OTHER, ActionTypeValue.UPDATE, "订单管理-确认发货")
  ship(@Param("orderNo") orderNo: string) { return this.redeemOrderService.ship(orderNo); }
}
