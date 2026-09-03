import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "@/common/entities/base.entity";

@Entity("gift_card")
export class GiftCard extends BaseEntity {
  @Index("uk_gift_card_card_no", { unique: true })
  @Column({ name: "card_no", length: 32, comment: "卡号" })
  cardNo: string;

  @Index("idx_gift_card_batch_id")
  @Column({ name: "batch_id", type: "bigint", comment: "批次ID" })
  batchId: string;

  @Column({ name: "pin_hash", length: 64, comment: "PIN 摘要" })
  pinHash: string;

  @Column({ name: "pin_ciphertext", type: "text", comment: "PIN 密文" })
  pinCiphertext: string;

  @Index("uk_gift_card_qr_token_hash", { unique: true })
  @Column({ name: "qr_token_hash", length: 64, comment: "二维码令牌摘要" })
  qrTokenHash: string;

  @Column({ name: "qr_token_ciphertext", type: "text", comment: "二维码令牌密文" })
  qrTokenCiphertext: string;

  @Column({ name: "product_id", type: "bigint", nullable: true, comment: "绑定商品ID" })
  productId?: string | null;

  @Column({ name: "product_snapshot", type: "json", nullable: true, comment: "绑定时的商品快照" })
  productSnapshot?: Record<string, unknown> | null;

  @Column({ length: 20, default: "UNBOUND", comment: "卡片状态：UNBOUND未绑定，ACTIVE可兑换" })
  status: "UNBOUND" | "ACTIVE";

  @Column({ name: "expiry_at", type: "datetime", nullable: true, comment: "兑换截止时间" })
  expiryAt?: Date | null;

  @Column({ name: "bound_at", type: "datetime", nullable: true, comment: "商品绑定时间" })
  boundAt?: Date | null;

  @Column({ name: "bind_remark", length: 255, nullable: true, comment: "商品绑定备注" })
  bindRemark?: string | null;

}
