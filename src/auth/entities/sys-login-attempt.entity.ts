import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("sys_login_attempt")
@Index("uk_login_attempt_username_ip", ["username", "ip"], { unique: true })
export class SysLoginAttempt {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ length: 64 })
  username: string;

  @Column({ length: 45 })
  ip: string;

  @Column({ name: "failure_count", type: "int", default: 0 })
  failureCount: number;

  @Column({ name: "window_end", type: "datetime" })
  windowEnd: Date;
}
