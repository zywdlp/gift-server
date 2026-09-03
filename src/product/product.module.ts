import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductController } from "./product.controller";
import { Product } from "./entities/product.entity";
import { ProductService } from "./product.service";
import { GiftCard } from "@/card-secret/entities/gift-card.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Product, GiftCard])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
