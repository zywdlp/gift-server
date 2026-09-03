import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { BusinessException } from "@/common/exceptions/business.exception";
import { decryptCardSecret, encryptCardSecret, generatePin, generateQrToken, hashCardSecret } from "@/common/utils/card-secret.util";
import { CardSecretQueryDto } from "./dto/card-secret-query.dto";
import { GenerateCardSecretDto } from "./dto/generate-card-secret.dto";
import { CardBatch } from "./entities/card-batch.entity";
import { GiftCard } from "./entities/gift-card.entity";
import { GiftCardQueryDto } from "./dto/gift-card-query.dto";
import { BindGiftCardsDto } from "./dto/bind-gift-cards.dto";
import { SysUser } from "@/system/user/entities/sys-user.entity";
import { Product } from "@/product/entities/product.entity";

@Injectable()
export class CardSecretService {
  constructor(
    @InjectRepository(CardBatch) private readonly batchRepository: Repository<CardBatch>,
    @InjectRepository(GiftCard) private readonly cardRepository: Repository<GiftCard>,
    @InjectRepository(SysUser) private readonly userRepository: Repository<SysUser>,
    private readonly dataSource: DataSource
  ) {}

  async getPage(query: CardSecretQueryDto) {
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

  async generate(dto: GenerateCardSecretDto) {
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

  async getGiftCardPage(query: GiftCardQueryDto) {
    const builder = this.cardRepository
      .createQueryBuilder("card")
      .leftJoin(CardBatch, "batch", "batch.id = card.batchId AND batch.isDeleted = 0")
      .leftJoin(Product, "product", "product.id = card.productId AND product.isDeleted = 0")
      .where("card.isDeleted = 0")
      .select([
        "card.id", "card.cardNo", "card.batchId", "card.productId", "card.status",
        "card.expiryAt", "card.boundAt", "card.bindRemark", "card.createTime",
      ])
      .addSelect("batch.batchNo", "batchNo")
      .addSelect("product.name", "productName");
    if (query.cardNo?.trim()) builder.andWhere("card.cardNo LIKE :cardNo", { cardNo: `%${query.cardNo.trim()}%` });
    if (query.batchNo?.trim()) builder.andWhere("batch.batchNo LIKE :batchNo", { batchNo: `%${query.batchNo.trim()}%` });
    if (query.productName?.trim()) builder.andWhere("product.name LIKE :productName", { productName: `%${query.productName.trim()}%` });
    if (query.status) builder.andWhere("card.status = :status", { status: query.status });
    const total = await builder.getCount();
    const result = await builder
      .orderBy("card.createTime", "DESC")
      .skip((query.pageNum - 1) * query.pageSize)
      .take(query.pageSize)
      .getRawAndEntities();
    return {
      data: result.entities.map((card, index) => ({
        ...card,
        batchNo: result.raw[index].batchNo || "-",
        productName: result.raw[index].productName || "-",
      })),
      page: { pageNum: query.pageNum, pageSize: query.pageSize, total },
    };
  }

  async bindGiftCards(dto: BindGiftCardsDto) {
    const cardIds = [...new Set(dto.cardIds)];
    if (cardIds.length !== dto.cardIds.length) throw new BusinessException("不能重复选择礼品卡");
    const expiryAt = new Date(dto.expiryAt);
    if (Number.isNaN(expiryAt.getTime()) || expiryAt <= new Date()) throw new BusinessException("有效期必须晚于当前时间");
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, { where: { id: dto.productId, isDeleted: 0 } });
      if (!product) throw new BusinessException("商品不存在或已删除");
      const cards = await manager
        .createQueryBuilder(GiftCard, "card")
        .setLock("pessimistic_write")
        .where("card.id IN (:...cardIds)", { cardIds })
        .andWhere("card.isDeleted = 0")
        .getMany();
      if (cards.length !== cardIds.length) throw new BusinessException("存在无效的礼品卡，请刷新后重试");
      if (cards.some((card) => card.status !== "UNBOUND" || card.productId)) {
        throw new BusinessException("仅未绑定商品的礼品卡可以绑定");
      }
      const now = new Date();
      const productSnapshot = {
        name: product.name,
        shortName: product.shortName || null,
        coverImage: product.coverImage || null,
        detailImages: product.detailImages || [],
        referenceValue: product.referenceValue || null,
        description: product.description || null,
        deliveryScope: product.deliveryScope || null,
        afterSales: product.afterSales || null,
      };
      cards.forEach((card) => Object.assign(card, {
        productId: product.id,
        productSnapshot,
        status: "ACTIVE" as const,
        expiryAt,
        boundAt: now,
        bindRemark: dto.remark?.trim() || null,
      }));
      await manager.save(GiftCard, cards, { chunk: 1000 });
      return { count: cards.length };
    });
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
