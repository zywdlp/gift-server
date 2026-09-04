import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "@/common/entities/base.entity";

@Entity("redeem_session")
export class RedeemSession extends BaseEntity {
  @Index("uk_redeem_session_token_hash", { unique: true })
  @Column({ name: "token_hash", length: 64, comment: "兑换会话令牌摘要" })
  tokenHash: string;

  @Index("idx_redeem_session_card_id")
  @Column({ name: "card_id", type: "bigint", comment: "礼品卡ID" })
  cardId: string;

  @Column({ name: "expires_at", type: "datetime", comment: "会话过期时间" })
  expiresAt: Date;

  @Column({ name: "used_at", type: "datetime", nullable: true, comment: "使用时间" })
  usedAt?: Date | null;
}
