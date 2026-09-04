import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("h5_sms_code")
export class H5SmsCode {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Index("uk_h5_sms_code_phone_hash", { unique: true })
  @Column({ name: "phone_hash", length: 64, comment: "手机号摘要" })
  phoneHash: string;

  @Column({ name: "code_hash", length: 100, comment: "验证码摘要" })
  codeHash: string;

  @Column({ name: "expires_at", type: "datetime", comment: "验证码过期时间" })
  expiresAt: Date;

  @Column({ name: "sent_at", type: "datetime", nullable: true, comment: "最近发送时间" })
  sentAt?: Date | null;

  @Column({ name: "send_window_started_at", type: "datetime", comment: "发送统计窗口开始时间" })
  sendWindowStartedAt: Date;

  @Column({ name: "send_count", type: "int", default: 0, comment: "当前窗口发送次数" })
  sendCount: number;

  @Column({ name: "verify_failure_count", type: "int", default: 0, comment: "验证码校验失败次数" })
  verifyFailureCount: number;

  @Column({ name: "is_used", type: "tinyint", default: 0, comment: "是否已使用" })
  isUsed: number;
}
