import { Column, Entity } from "typeorm";
import { BaseEntity } from "@/common/entities/base.entity";

/** 商品只描述礼品，不承载库存、卡密、面值或有效期。 */
@Entity("product")
export class Product extends BaseEntity {
  @Column({ length: 100, comment: "商品名称" })
  name: string;

  @Column({ name: "short_name", length: 100, nullable: true, comment: "商品简称" })
  shortName?: string | null;

  @Column({ name: "cover_image", length: 500, nullable: true, comment: "商品主图地址" })
  coverImage?: string | null;

  @Column({ name: "detail_images", type: "json", nullable: true, comment: "商品详情图片地址" })
  detailImages?: string[] | null;

  @Column({ name: "reference_value", type: "decimal", precision: 10, scale: 2, nullable: true, comment: "参考价值" })
  referenceValue?: string | null;

  @Column({ type: "text", nullable: true, comment: "商品详情" })
  description?: string | null;

  @Column({ name: "delivery_scope", type: "text", nullable: true, comment: "配送范围" })
  deliveryScope?: string | null;

  @Column({ name: "after_sales", type: "text", nullable: true, comment: "售后说明" })
  afterSales?: string | null;
}
