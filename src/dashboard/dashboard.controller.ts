import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminOnlyGuard } from "@/common/guards/admin-only.guard";
import { DashboardService } from "./dashboard.service";

@ApiTags("数据概览")
@Controller("dashboard")
@UseGuards(AdminOnlyGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("overview")
  @ApiOperation({ summary: "获取数据概览" })
  getOverview() { return this.dashboardService.getOverview(); }
}
