import { Injectable } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { GiftCard } from "@/card-secret/entities/gift-card.entity";
import { Product } from "@/product/entities/product.entity";
import { RedeemOrder } from "@/h5-redeem/entities/redeem-order.entity";
import { H5User } from "@/h5-auth/entities/h5-user.entity";
import { decryptCardSecret } from "@/common/utils/card-secret.util";

@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview() {
    const productRepository = this.dataSource.getRepository(Product);
    const cardRepository = this.dataSource.getRepository(GiftCard);
    const orderRepository = this.dataSource.getRepository(RedeemOrder);
    const now = new Date();
    const [productTotal, cardTotal, unbound, redeemed, expired, orderRows, recentOrders] = await Promise.all([
      productRepository.count({ where: { isDeleted: 0 } }), cardRepository.count({ where: { isDeleted: 0 } }),
      cardRepository.count({ where: { isDeleted: 0, status: "UNBOUND" } }), cardRepository.count({ where: { isDeleted: 0, status: "REDEEMED" } }),
      cardRepository.createQueryBuilder("card").where("card.isDeleted = 0").andWhere("card.status = :status", { status: "ACTIVE" }).andWhere("card.expiryAt IS NOT NULL").andWhere("card.expiryAt < :now", { now }).getCount(),
      orderRepository.createQueryBuilder("order").select("order.status", "status").addSelect("COUNT(1)", "total").where("order.isDeleted = 0").groupBy("order.status").getRawMany<{ status: string; total: string }>(),
      orderRepository.find({ where: { isDeleted: 0 }, order: { createTime: "DESC" }, take: 5 }),
    ]);
    const cardIds = [...new Set(recentOrders.map((order) => order.cardId))];
    const userIds = [...new Set(recentOrders.map((order) => order.h5UserId))];
    const [cards, users] = await Promise.all([
      cardIds.length ? cardRepository.find({ where: { id: In(cardIds), isDeleted: 0 }, select: ["id", "cardNo"] }) : [],
      userIds.length ? this.dataSource.getRepository(H5User).find({ where: { id: In(userIds), isDeleted: 0 }, select: ["id", "phoneCiphertext"] }) : [],
    ]);
    const cardNoMap = new Map<string, string>(cards.map((card): [string, string] => [card.id, card.cardNo]));
    const phoneMap = new Map<string, string>(users.map((user): [string, string] => [user.id, decryptCardSecret(user.phoneCiphertext)]));
    const orders = new Map(orderRows.map((item) => [item.status, Number(item.total)]));
    return {
      productTotal,
      cards: { total: cardTotal, unbound, active: Math.max(cardTotal - unbound - redeemed - expired, 0), redeemed, expired },
      orders: { total: [...orders.values()].reduce((sum, total) => sum + total, 0), pendingShipment: orders.get("PENDING_SHIPMENT") || 0, shipped: orders.get("SHIPPED") || 0 },
      recentOrders: recentOrders.map((order) => ({ orderNo: order.orderNo, cardNo: cardNoMap.get(order.cardId) || "-", productName: String(order.productSnapshot?.name || "礼品"), redeemerPhone: phoneMap.get(order.h5UserId) || "-", recipient: order.recipient, status: order.status, createTime: order.createTime })),
      generatedAt: now,
    };
  }
}
