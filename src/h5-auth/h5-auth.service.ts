import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { randomInt, randomUUID } from "crypto";
import { DataSource, Repository } from "typeorm";
import { BusinessException } from "@/common/exceptions/business.exception";
import { encryptCardSecret, hashCardSecret } from "@/common/utils/card-secret.util";
import { H5LoginDto } from "./dto/h5-login.dto";
import { H5SmsCode } from "./entities/h5-sms-code.entity";
import { H5User } from "./entities/h5-user.entity";

const SMS_RESEND_MS = 60 * 1000;
const SMS_WINDOW_MS = 60 * 60 * 1000;
const SMS_WINDOW_LIMIT = 5;
const SMS_EXPIRES_MS = 5 * 60 * 1000;
const SMS_VERIFY_LIMIT = 5;

@Injectable()
export class H5AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(H5SmsCode) private readonly smsCodeRepository: Repository<H5SmsCode>,
  ) {}

  async sendSms(phone: string) {
    const isDebugMode = process.env.H5_SMS_DEBUG === "true";
    if (!isDebugMode) {
      throw new BusinessException("短信服务尚未配置");
    }
    const phoneHash = hashCardSecret(phone);
    const code = String(randomInt(100000, 1_000_000));
    const expiresAt = new Date(Date.now() + SMS_EXPIRES_MS);
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        "INSERT IGNORE INTO h5_sms_code (phone_hash, code_hash, expires_at, send_window_started_at, send_count, verify_failure_count, is_used) VALUES (?, '', DATE_SUB(NOW(), INTERVAL 1 SECOND), NOW(), 0, 0, 1)",
        [phoneHash],
      );
      const record = await manager
        .createQueryBuilder(H5SmsCode, "sms")
        .setLock("pessimistic_write")
        .where("sms.phoneHash = :phoneHash", { phoneHash })
        .getOneOrFail();
      const now = new Date();
      if (record.sentAt && now.getTime() - record.sentAt.getTime() < SMS_RESEND_MS) {
        throw new BusinessException("请 60 秒后再获取验证码");
      }
      if (now.getTime() - record.sendWindowStartedAt.getTime() >= SMS_WINDOW_MS) {
        record.sendWindowStartedAt = now;
        record.sendCount = 0;
      }
      if (record.sendCount >= SMS_WINDOW_LIMIT) {
        throw new BusinessException("该手机号发送验证码过于频繁，请稍后再试");
      }
      record.codeHash = await bcrypt.hash(code, 10);
      record.expiresAt = expiresAt;
      record.sentAt = now;
      record.sendCount += 1;
      record.verifyFailureCount = 0;
      record.isUsed = 0;
      await manager.getRepository(H5SmsCode).save(record);
    });
    return { expiresAt, resendAfter: 60, debugCode: code };
  }

  async login(dto: H5LoginDto) {
    const phoneHash = hashCardSecret(dto.phone);
    const user = await this.dataSource.transaction(async (manager) => {
      const sms = await manager
        .createQueryBuilder(H5SmsCode, "sms")
        .setLock("pessimistic_write")
        .where("sms.phoneHash = :phoneHash", { phoneHash })
        .getOne();
      if (!sms || sms.isUsed || sms.expiresAt.getTime() <= Date.now()) {
        throw new BusinessException("短信验证码已过期，请重新获取");
      }
      if (sms.verifyFailureCount >= SMS_VERIFY_LIMIT) {
        throw new BusinessException("验证码错误次数过多，请重新获取验证码");
      }
      if (!(await bcrypt.compare(dto.code, sms.codeHash))) {
        sms.verifyFailureCount += 1;
        await manager.getRepository(H5SmsCode).save(sms);
        throw new BusinessException("短信验证码错误");
      }
      sms.isUsed = 1;
      await manager.getRepository(H5SmsCode).save(sms);
      let h5User = await manager.getRepository(H5User).findOne({ where: { phoneHash, isDeleted: 0 } });
      if (!h5User) {
        h5User = manager.getRepository(H5User).create({ phoneHash, phoneCiphertext: encryptCardSecret(dto.phone), status: 1 });
        await manager.getRepository(H5User).save(h5User);
      }
      if (h5User.status !== 1) throw new BusinessException("该手机号暂不可登录");
      return h5User;
    });
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: `h5:${user.id}`,
      roles: [],
      h5UserId: user.id,
      jti: randomUUID(),
    });
    return {
      accessToken,
      expiresIn: this.configService.get<number>("jwt.expiresIn") || 7200,
      phoneMasked: this.maskPhone(dto.phone),
    };
  }

  private maskPhone(phone: string) {
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }
}
