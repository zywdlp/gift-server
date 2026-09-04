import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GiftCard } from "@/card-secret/entities/gift-card.entity";
import { PinAttempt } from "./entities/pin-attempt.entity";
import { RedeemSession } from "./entities/redeem-session.entity";
import { RedeemOrder } from "./entities/redeem-order.entity";
import { H5User } from "@/h5-auth/entities/h5-user.entity";
import { H5RedeemController } from "./h5-redeem.controller";
import { H5OrderController } from "./h5-order.controller";
import { H5RedeemService } from "./h5-redeem.service";

@Module({
  imports: [TypeOrmModule.forFeature([GiftCard, RedeemSession, PinAttempt, RedeemOrder, H5User])],
  controllers: [H5RedeemController, H5OrderController],
  providers: [H5RedeemService],
})
export class H5RedeemModule {}
