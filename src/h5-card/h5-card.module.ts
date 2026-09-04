import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GiftCard } from "@/card-secret/entities/gift-card.entity";
import { H5CardController } from "./h5-card.controller";
import { H5CardService } from "./h5-card.service";

@Module({
  imports: [TypeOrmModule.forFeature([GiftCard])],
  controllers: [H5CardController],
  providers: [H5CardService],
})
export class H5CardModule {}
