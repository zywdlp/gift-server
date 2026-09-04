import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "@/common/entities/base.entity";

@Entity("h5_pin_attempt")
export class PinAttempt extends BaseEntity {
  @Index("uk_h5_pin_attempt_card_id", { unique: true })
  @Column({ name: "card_id", type: "bigint", comment: "礼品卡ID" })
  cardId: string;

  @Column({ name: "failed_count", type: "int", default: 0, comment: "当前窗口失败次数" })
  failedCount: number;

  @Column({ name: "window_started_at", type: "datetime", comment: "失败统计窗口开始时间" })
  windowStartedAt: Date;

  @Column({ name: "blocked_until", type: "datetime", nullable: true, comment: "限制截止时间" })
  blockedUntil?: Date | null;
}
