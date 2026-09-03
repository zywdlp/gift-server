import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { BusinessException } from "@/common/exceptions/business.exception";
import { decryptCardSecret, encryptCardSecret, generatePin, generateQrToken, hashCardSecret } from "@/common/utils/card-secret.util";
import { CardBatchQueryDto } from "./dto/card-batch-query.dto";
import { GenerateCardBatchDto } from "./dto/generate-card-batch.dto";
import { CardBatch } from "./entities/card-batch.entity";
import { GiftCard } from "./entities/gift-card.entity";
import { SysUser } from "@/system/user/entities/sys-user.entity";

@Injectable()
export class CardBatchService {
  constructor(
    @InjectRepository(CardBatch) private readonly batchRepository: Repository<CardBatch>,
    @InjectRepository(GiftCard) private readonly cardRepository: Repository<GiftCard>,
    @InjectRepository(SysUser) private readonly userRepository: Repository<SysUser>,
    private readonly dataSource: DataSource
  ) {}

  async getPage(query: CardBatchQueryDto) {
    const builder = this.batchRepository.createQueryBuilder("batch").where("batch.isDeleted = 0");
    if (query.keywords?.trim()) builder.andWhere("batch.batchNo LIKE :keywords", { keywords: `%${query.keywords.trim()}%` });
    const [data, total] = await builder
      .orderBy("batch.createTime", "DESC")
      .skip((query.pageNum - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
    const userIds = [...new Set(data.map((item) => item.createBy).filter((id): id is string => !!id))];
    const users = userIds.length
      ? await this.userRepository.find({ where: { id: In(userIds) }, select: ["id", "nickname", "username"] })
      : [];
    const operatorNames = new Map(users.map((user) => [user.id, user.nickname || user.username]));
    return {
      data: data.map((item) => ({ ...item, operatorName: item.createBy ? (operatorNames.get(item.createBy) || item.createBy) : "-" })),
      page: { pageNum: query.pageNum, pageSize: query.pageSize, total },
    };
  }

  async generate(dto: GenerateCardBatchDto) {
    const existing = await this.batchRepository.findOne({ where: { requestId: dto.requestId, isDeleted: 0 } });
    if (existing) return existing;

    try {
      return await this.dataSource.transaction(async (manager) => {
        const batch = await manager.save(manager.create(CardBatch, {
          batchNo: this.generateBatchNo(), quantity: dto.quantity, requestId: dto.requestId, remark: dto.remark?.trim() || null,
        }));
        const cards = Array.from({ length: dto.quantity }, (_, index) => {
          const pin = generatePin();
          const qrToken = generateQrToken();
          return manager.create(GiftCard, {
            batchId: batch.id,
            cardNo: this.generateCardNo(batch.id, index + 1),
            pinHash: hashCardSecret(pin),
            pinCiphertext: encryptCardSecret(pin),
            qrTokenHash: hashCardSecret(qrToken),
            qrTokenCiphertext: encryptCardSecret(qrToken),
          });
        });
        await manager.save(GiftCard, cards, { chunk: 1000 });
        return batch;
      });
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") throw new BusinessException("卡密生成冲突，请重新提交");
      throw error;
    }
  }

  async getCards(batchId: string, pageNum = 1, pageSize = 20) {
    await this.findBatch(batchId);
    const [data, total] = await this.cardRepository.findAndCount({
      where: { batchId, isDeleted: 0 }, order: { createTime: "DESC" }, skip: (pageNum - 1) * pageSize, take: pageSize,
    });
    return {
      data: data.map(({ pinHash, pinCiphertext, qrTokenHash, qrTokenCiphertext, ...card }) => ({
        ...card,
        pin: decryptCardSecret(pinCiphertext),
        qrToken: decryptCardSecret(qrTokenCiphertext),
      })),
      page: { pageNum, pageSize, total },
    };
  }

  async getCardsForExport(batchId: string) {
    await this.findBatch(batchId);
    return await this.cardRepository.find({ where: { batchId, isDeleted: 0 }, order: { id: "ASC" } });
  }

  getPin(card: GiftCard) {
    return decryptCardSecret(card.pinCiphertext);
  }

  getQrToken(card: GiftCard) {
    return decryptCardSecret(card.qrTokenCiphertext);
  }

  private async findBatch(id: string) {
    const batch = await this.batchRepository.findOne({ where: { id, isDeleted: 0 } });
    if (!batch) throw new BusinessException("卡密批次不存在");
    return batch;
  }

  private generateBatchNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `B${date}${randomBytes(4).toString("hex").toUpperCase()}`;
  }

  private generateCardNo(batchId: string, sequence: number) {
    return `C${batchId.padStart(8, "0")}${String(sequence).padStart(4, "0")}`;
  }
}
