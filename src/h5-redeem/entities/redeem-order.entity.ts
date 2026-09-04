import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "@/common/entities/base.entity";

@Entity("redeem_order")
export class RedeemOrder extends BaseEntity {
  @Index("uk_redeem_order_order_no", { unique: true })
  @Column({ name: "order_no", length: 32, comment: "兑换订单号" })
  orderNo: string;

  @Index("uk_redeem_order_request_id", { unique: true })
  @Column({ name: "request_id", length: 64, comment: "前端幂等请求标识" })
  requestId: string;

  @Index("uk_redeem_order_card_id", { unique: true })
  @Column({ name: "card_id", type: "bigint", comment: "礼品卡ID" })
  cardId: string;

  @Index("idx_redeem_order_h5_user_id")
  @Column({ name: "h5_user_id", type: "bigint", comment: "H5用户ID" })
  h5UserId: string;

  @Column({ name: "product_snapshot", type: "json", comment: "兑换商品快照" })
  productSnapshot: Record<string, unknown>;

  @Column({ length: 20, default: "PENDING_SHIPMENT", comment: "订单状态" })
  status: string;

  @Column({ length: 20, comment: "收件人" })
  recipient: string;

  @Column({ name: "phone_hash", length: 64, comment: "收件手机号摘要" })
  phoneHash: string;

  @Column({ name: "phone_ciphertext", type: "text", comment: "收件手机号密文" })
  phoneCiphertext: string;

  @Column({ type: "json", comment: "省市区" })
  region: string[];

  @Column({ name: "address_detail", length: 100, comment: "详细地址" })
  addressDetail: string;
}
