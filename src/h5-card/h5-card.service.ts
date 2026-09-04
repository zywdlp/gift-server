import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { hashCardSecret } from "@/common/utils/card-secret.util";
import { GiftCard } from "@/card-secret/entities/gift-card.entity";

@Injectable()
export class H5CardService {
  constructor(@InjectRepository(GiftCard) private readonly giftCardRepository: Repository<GiftCard>) {}

  async getByToken(token: string) {
    const normalizedToken = token?.trim();
    if (!normalizedToken) return { cardStatus: "INVALID" };
    const card = await this.giftCardRepository.findOne({
      where: { qrTokenHash: hashCardSecret(normalizedToken), isDeleted: 0 },
      select: ["cardNo", "status", "expiryAt", "productSnapshot"],
    });
    if (!card) return { cardStatus: "INVALID" };
    const snapshot = card.productSnapshot as Record<string, any> | null;
    const product = snapshot ? {
      name: snapshot.name,
      images: [snapshot.coverImage, ...(snapshot.detailImages || [])].filter(Boolean),
    } : undefined;
    if (card.status === "ACTIVE" && card.expiryAt && card.expiryAt.getTime() <= Date.now()) {
      return { cardStatus: "EXPIRED", cardNoMasked: this.maskCardNo(card.cardNo), expiryAt: card.expiryAt, product };
    }
    if (card.status !== "ACTIVE" || !snapshot) {
      return { cardStatus: card.status || "UNBOUND", cardNoMasked: this.maskCardNo(card.cardNo), expiryAt: card.expiryAt, product };
    }
    return {
      cardStatus: "ACTIVE",
      cardNoMasked: this.maskCardNo(card.cardNo),
      expiryAt: card.expiryAt,
      product: {
        name: snapshot.name,
        images: [snapshot.coverImage, ...(snapshot.detailImages || [])].filter(Boolean),
        price: snapshot.referenceValue,
        description: snapshot.description,
        deliveryScope: snapshot.deliveryScope,
        afterSaleRule: snapshot.afterSales,
      },
    };
  }

  private maskCardNo(cardNo: string) {
    return `****${cardNo.slice(-4)}`;
  }
}
