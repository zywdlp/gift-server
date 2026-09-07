import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { AdminOnlyGuard } from "@/common/guards/admin-only.guard";

@Module({ controllers: [DashboardController], providers: [DashboardService, AdminOnlyGuard] })
export class DashboardModule {}
