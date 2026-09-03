import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CardBatchController } from "./card-batch.controller";
import { CardBatchService } from "./card-batch.service";
import { CardBatch } from "./entities/card-batch.entity";
import { GiftCard } from "./entities/gift-card.entity";
import { SysUser } from "@/system/user/entities/sys-user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CardBatch, GiftCard, SysUser])],
  controllers: [CardBatchController],
  providers: [CardBatchService],
})
export class CardBatchModule {}
