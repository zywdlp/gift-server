import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("sys_token_blacklist")
@Index("uk_token_blacklist_jti", ["jti"], { unique: true })
export class SysTokenBlacklist {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id: string;

  @Column({ length: 64 })
  jti: string;

  @Column({ name: "expire_time", type: "datetime" })
  expireTime: Date;
}
