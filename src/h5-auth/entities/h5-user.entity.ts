import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "@/common/entities/base.entity";

@Entity("h5_user")
export class H5User extends BaseEntity {
  @Index("uk_h5_user_phone_hash", { unique: true })
  @Column({ name: "phone_hash", length: 64, comment: "手机号摘要" })
  phoneHash: string;

  @Column({ name: "phone_ciphertext", type: "text", comment: "手机号密文" })
  phoneCiphertext: string;

  @Column({ type: "tinyint", default: 1, comment: "状态：1正常，0禁用" })
  status: number;
}
