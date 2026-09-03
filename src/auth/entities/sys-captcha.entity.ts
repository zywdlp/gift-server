import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("sys_captcha")
export class SysCaptcha {
  @PrimaryColumn({ name: "captcha_id", length: 64 })
  captchaId: string;

  @Column({ name: "captcha_hash", length: 100 })
  captchaHash: string;

  @Column({ name: "expire_time", type: "datetime" })
  expireTime: Date;

  @Column({ name: "is_used", type: "tinyint", default: 0 })
  isUsed: number;
}
