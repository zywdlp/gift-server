import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RedeemOrder } from "@/h5-redeem/entities/redeem-order.entity";
import { RedeemOrderController } from "./redeem-order.controller";
import { RedeemOrderService } from "./redeem-order.service";
import { AdminOnlyGuard } from "@/common/guards/admin-only.guard";
@Module({ imports: [TypeOrmModule.forFeature([RedeemOrder])], controllers: [RedeemOrderController], providers: [RedeemOrderService, AdminOnlyGuard] })
export class RedeemOrderModule {}
