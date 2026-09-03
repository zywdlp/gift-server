import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CardSecretController } from "./card-secret.controller";
import { CardSecretService } from "./card-secret.service";
import { CardBatch } from "./entities/card-batch.entity";
import { GiftCard } from "./entities/gift-card.entity";
import { SysUser } from "@/system/user/entities/sys-user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CardBatch, GiftCard, SysUser])],
  controllers: [CardSecretController],
  providers: [CardSecretService],
})
export class CardSecretModule {}
