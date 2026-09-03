import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "@/common/entities/base.entity";

@Entity("card_batch")
export class CardBatch extends BaseEntity {
  @Index("uk_card_batch_batch_no", { unique: true })
  @Column({ name: "batch_no", length: 40, comment: "批次编号" })
  batchNo: string;

  @Column({ type: "int", unsigned: true, comment: "生成数量" })
  quantity: number;

  @Index("uk_card_batch_request_id", { unique: true })
  @Column({ name: "request_id", length: 64, comment: "幂等请求标识" })
  requestId: string;

  @Column({ length: 255, nullable: true, comment: "备注" })
  remark?: string | null;
}
