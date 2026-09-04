import { Injectable } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { BusinessException } from "@/common/exceptions/business.exception";
import { decryptCardSecret, hashCardSecret } from "@/common/utils/card-secret.util";
import { RedeemOrder } from "@/h5-redeem/entities/redeem-order.entity";
import { GiftCard } from "@/card-secret/entities/gift-card.entity";
import { H5User } from "@/h5-auth/entities/h5-user.entity";
import { RedeemOrderQueryDto } from "./dto/redeem-order-query.dto";

@Injectable()
export class RedeemOrderService {
  constructor(private readonly dataSource: DataSource) {}

  async getPage(query: RedeemOrderQueryDto) {
    const builder = this.dataSource.getRepository(RedeemOrder).createQueryBuilder("redeemOrder").where("redeemOrder.isDeleted = 0");
    builder.leftJoin(GiftCard, "giftCard", "giftCard.id = redeemOrder.cardId AND giftCard.isDeleted = 0");
    builder.leftJoin(H5User, "redeemer", "redeemer.id = redeemOrder.h5UserId AND redeemer.isDeleted = 0");
    if (query.orderNo?.trim()) builder.andWhere("redeemOrder.orderNo LIKE :orderNo", { orderNo: `%${query.orderNo.trim()}%` });
    if (query.cardNo?.trim()) builder.andWhere("giftCard.cardNo LIKE :cardNo", { cardNo: `%${query.cardNo.trim()}%` });
    if (query.redeemerPhone?.trim()) builder.andWhere("redeemer.phoneHash = :redeemerPhoneHash", { redeemerPhoneHash: hashCardSecret(query.redeemerPhone.trim()) });
    if (query.productName?.trim()) builder.andWhere("JSON_UNQUOTE(JSON_EXTRACT(redeemOrder.productSnapshot, '$.name')) LIKE :productName", { productName: `%${query.productName.trim()}%` });
    if (query.status) builder.andWhere("redeemOrder.status = :status", { status: query.status });
    const [data, total] = await builder.orderBy("redeemOrder.createTime", "DESC").skip((query.pageNum! - 1) * query.pageSize!).take(query.pageSize).getManyAndCount();
    const cardIds = [...new Set(data.map((order) => order.cardId))];
    const userIds = [...new Set(data.map((order) => order.h5UserId))];
    const cards = cardIds.length ? await this.dataSource.getRepository(GiftCard).find({ where: { id: In(cardIds), isDeleted: 0 }, select: ["id", "cardNo"] }) : [];
    const redeemers = userIds.length ? await this.dataSource.getRepository(H5User).find({ where: { id: In(userIds), isDeleted: 0 }, select: ["id", "phoneCiphertext"] }) : [];
    const cardNoMap = new Map(cards.map((card) => [card.id, card.cardNo]));
    const redeemerPhoneMap = new Map(redeemers.map((user) => [user.id, decryptCardSecret(user.phoneCiphertext)]));
    return {
      data: data.map((order) => ({
        orderNo: order.orderNo, cardNo: cardNoMap.get(order.cardId) || "-", redeemerPhone: redeemerPhoneMap.get(order.h5UserId) || "-", status: order.status, createTime: order.createTime, updateTime: order.updateTime,
        productName: String(order.productSnapshot?.name || "礼品"), recipient: order.recipient,
        phone: decryptCardSecret(order.phoneCiphertext), address: `${order.region.join("")}${order.addressDetail}`,
      })), page: { pageNum: query.pageNum, pageSize: query.pageSize, total },
    };
  }

  async ship(orderNo: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.createQueryBuilder(RedeemOrder, "redeemOrder").setLock("pessimistic_write")
        .where("redeemOrder.orderNo = :orderNo", { orderNo }).andWhere("redeemOrder.isDeleted = 0").getOne();
      if (!order) throw new BusinessException("订单不存在");
      if (order.status === "SHIPPED") return true;
      if (order.status !== "PENDING_SHIPMENT") throw new BusinessException("当前订单不能确认发货");
      order.status = "SHIPPED";
      await manager.save(order);
      return true;
    });
  }
}
