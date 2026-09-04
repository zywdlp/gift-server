import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { DataSource } from "typeorm";
import { BusinessException } from "@/common/exceptions/business.exception";
import { decryptCardSecret, encryptCardSecret, hashCardSecret } from "@/common/utils/card-secret.util";
import { GiftCard } from "@/card-secret/entities/gift-card.entity";
import { VerifyPinDto } from "./dto/verify-pin.dto";
import { PinAttempt } from "./entities/pin-attempt.entity";
import { RedeemSession } from "./entities/redeem-session.entity";
import { RedeemOrder } from "./entities/redeem-order.entity";
import { SubmitRedeemDto } from "./dto/submit-redeem.dto";
import { H5User } from "@/h5-auth/entities/h5-user.entity";

const PIN_WINDOW_MS = 15 * 60 * 1000;
const PIN_MAX_FAILURES = 5;
const REDEEM_SESSION_MS = 15 * 60 * 1000;

@Injectable()
export class H5RedeemService {
  constructor(private readonly dataSource: DataSource) {}

  async verifyPin(dto: VerifyPinDto) {
    const cardToken = dto.cardToken.trim();
    return this.dataSource.transaction(async (manager) => {
      const card = await manager
        .createQueryBuilder(GiftCard, "card")
        .setLock("pessimistic_write")
        .where("card.qrTokenHash = :tokenHash", { tokenHash: hashCardSecret(cardToken) })
        .andWhere("card.isDeleted = 0")
        .getOne();
      if (!card || card.status !== "ACTIVE" || !card.expiryAt || card.expiryAt.getTime() <= Date.now()) {
        throw new BusinessException("该礼品卡暂不可兑换");
      }

      const now = new Date();
      const attemptRepository = manager.getRepository(PinAttempt);
      let attempt = await attemptRepository.findOne({ where: { cardId: card.id, isDeleted: 0 } });
      if (attempt?.blockedUntil && attempt.blockedUntil.getTime() > now.getTime()) {
        throw new BusinessException("验证次数过多，请 15 分钟后重试");
      }
      if (!attempt || now.getTime() - attempt.windowStartedAt.getTime() >= PIN_WINDOW_MS) {
        attempt = attemptRepository.create({ cardId: card.id, failedCount: 0, windowStartedAt: now, blockedUntil: null });
      }

      if (hashCardSecret(dto.pin) !== card.pinHash) {
        attempt.failedCount += 1;
        if (attempt.failedCount >= PIN_MAX_FAILURES) attempt.blockedUntil = new Date(now.getTime() + PIN_WINDOW_MS);
        await attemptRepository.save(attempt);
        throw new BusinessException(attempt.blockedUntil ? "验证次数过多，请 15 分钟后重试" : "兑换密码错误，请重新输入");
      }

      attempt.failedCount = 0;
      attempt.windowStartedAt = now;
      attempt.blockedUntil = null;
      await attemptRepository.save(attempt);
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(now.getTime() + REDEEM_SESSION_MS);
      await manager.getRepository(RedeemSession).save(manager.create(RedeemSession, {
        tokenHash: hashCardSecret(token), cardId: card.id, expiresAt,
      }));
      return { redeemSessionToken: token, expiredAt: expiresAt };
    });
  }

  async submit(dto: SubmitRedeemDto, h5UserId: string) {
    if (!h5UserId) throw new BusinessException("请先完成短信登录");
    const cardToken = dto.cardToken.trim();
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(H5User, { where: { id: h5UserId, isDeleted: 0 } });
      if (!user || user.status !== 1) throw new BusinessException("当前登录已失效，请重新登录");

      const existingOrder = await manager.findOne(RedeemOrder, { where: { requestId: dto.requestId, isDeleted: 0 } });
      if (existingOrder) {
        if (existingOrder.h5UserId !== h5UserId) throw new BusinessException("请求标识无效");
        return { orderNo: existingOrder.orderNo, status: existingOrder.status, repeated: true };
      }

      const card = await manager
        .createQueryBuilder(GiftCard, "card")
        .setLock("pessimistic_write")
        .where("card.qrTokenHash = :tokenHash", { tokenHash: hashCardSecret(cardToken) })
        .andWhere("card.isDeleted = 0")
        .getOne();
      // 同一 requestId 并发提交时，第二个请求会在卡行锁上等待；拿到锁后必须再次读取订单。
      const completedOrder = await manager.findOne(RedeemOrder, { where: { requestId: dto.requestId, isDeleted: 0 } });
      if (completedOrder) {
        if (completedOrder.h5UserId !== h5UserId) throw new BusinessException("请求标识无效");
        return { orderNo: completedOrder.orderNo, status: completedOrder.status, repeated: true };
      }
      if (!card || card.status !== "ACTIVE" || !card.expiryAt || card.expiryAt.getTime() <= Date.now() || !card.productSnapshot) {
        throw new BusinessException("该礼品卡暂不可兑换");
      }

      const session = await manager
        .createQueryBuilder(RedeemSession, "session")
        .setLock("pessimistic_write")
        .where("session.tokenHash = :tokenHash", { tokenHash: hashCardSecret(dto.redeemSessionToken) })
        .andWhere("session.cardId = :cardId", { cardId: card.id })
        .andWhere("session.isDeleted = 0")
        .getOne();
      if (!session || session.usedAt || session.expiresAt.getTime() <= Date.now()) {
        throw new BusinessException("兑换验证已失效，请重新验证兑换密码");
      }

      const order = manager.create(RedeemOrder, {
        orderNo: this.generateOrderNo(),
        requestId: dto.requestId,
        cardId: card.id,
        h5UserId,
        productSnapshot: card.productSnapshot,
        recipient: dto.address.recipient.trim(),
        phoneHash: hashCardSecret(dto.address.phone),
        phoneCiphertext: encryptCardSecret(dto.address.phone),
        region: [dto.address.province.trim(), dto.address.city.trim(), dto.address.district.trim()],
        addressDetail: dto.address.detail.trim(),
        status: "PENDING_SHIPMENT",
      });
      session.usedAt = new Date();
      card.status = "REDEEMED";
      await manager.save(RedeemOrder, order);
      await manager.save(RedeemSession, session);
      await manager.save(GiftCard, card);
      return { orderNo: order.orderNo, status: order.status, repeated: false };
    });
  }

  async getOrders(h5UserId: string) {
    await this.assertH5UserActive(h5UserId);
    const [list, total] = await this.dataSource.getRepository(RedeemOrder).findAndCount({
      where: { h5UserId, isDeleted: 0 },
      select: ["orderNo", "status", "productSnapshot", "createTime"],
      order: { createTime: "DESC" },
    });
    return {
      list: list.map((order) => ({
        orderNo: order.orderNo,
        status: order.status,
        productName: String((order.productSnapshot as Record<string, unknown>)?.name || "礼品"),
        createTime: order.createTime,
      })),
      total,
    };
  }

  async getOrderDetail(h5UserId: string, orderNo: string) {
    await this.assertH5UserActive(h5UserId);
    const order = await this.dataSource.getRepository(RedeemOrder).findOne({
      where: { h5UserId, orderNo, isDeleted: 0 },
    });
    if (!order) throw new BusinessException("订单不存在或无权查看");
    const product = order.productSnapshot as Record<string, unknown>;
    return {
      orderNo: order.orderNo,
      status: order.status,
      createTime: order.createTime,
      product: {
        name: product?.name || "礼品",
        image: product?.coverImage || null,
        referenceValue: product?.referenceValue || null,
      },
      recipient: order.recipient,
      phone: decryptCardSecret(order.phoneCiphertext),
      address: `${order.region.join("")}${order.addressDetail}`,
    };
  }

  private async assertH5UserActive(h5UserId: string) {
    if (!h5UserId) throw new BusinessException("请先完成短信登录");
    const user = await this.dataSource.getRepository(H5User).findOne({ where: { id: h5UserId, isDeleted: 0 }, select: ["id", "status"] });
    if (!user || user.status !== 1) throw new BusinessException("当前登录已失效，请重新登录");
  }

  private generateOrderNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `R${date}${randomBytes(5).toString("hex").toUpperCase()}`;
  }
}
