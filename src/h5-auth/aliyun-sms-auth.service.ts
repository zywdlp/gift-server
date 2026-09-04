import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Client, {
  CheckSmsVerifyCodeRequest,
  SendSmsVerifyCodeRequest,
} from "@alicloud/dypnsapi20170525";
import { BusinessException } from "@/common/exceptions/business.exception";

const SMS_CODE_EXPIRES_SECONDS = 300;
const SMS_RESEND_SECONDS = 60;

/** 阿里云号码认证「短信认证」服务，仅在服务端调用。 */
@Injectable()
export class AliyunSmsAuthService {
  private readonly logger = new Logger(AliyunSmsAuthService.name);
  private client?: Client;

  constructor(private readonly configService: ConfigService) {}

  async sendCode(phone: string) {
    try {
      const response = await this.getClient().sendSmsVerifyCode(
        new SendSmsVerifyCodeRequest({
          phoneNumber: phone,
          countryCode: "86",
          signName: this.getRequiredConfig("ALIYUN_SMS_AUTH_SIGN_NAME"),
          templateCode: this.getRequiredConfig("ALIYUN_SMS_AUTH_TEMPLATE_CODE"),
          templateParam: JSON.stringify({
            code: "##code##",
            min: String(SMS_CODE_EXPIRES_SECONDS / 60),
          }),
          codeLength: 6,
          codeType: 1,
          validTime: SMS_CODE_EXPIRES_SECONDS,
          interval: SMS_RESEND_SECONDS,
          duplicatePolicy: 1,
          returnVerifyCode: false,
        }),
      );
      if (!response.body?.success || response.body.code !== "OK") {
        this.logger.warn(`阿里云短信发送失败: ${response.body?.code || "UNKNOWN"}`);
        throw new BusinessException("验证码发送失败，请稍后重试");
      }
    } catch (error) {
      if (error instanceof BusinessException) throw error;
      this.logger.error("阿里云短信发送异常", error instanceof Error ? error.stack : undefined);
      throw new BusinessException("验证码发送失败，请稍后重试");
    }
  }

  async verifyCode(phone: string, code: string) {
    try {
      const response = await this.getClient().checkSmsVerifyCode(
        new CheckSmsVerifyCodeRequest({
          phoneNumber: phone,
          countryCode: "86",
          verifyCode: code,
        }),
      );
      if (!response.body?.success || response.body.code !== "OK") {
        this.logger.warn(`阿里云短信验证失败: ${response.body?.code || "UNKNOWN"}`);
        return false;
      }
      return response.body.model?.verifyResult === "PASS";
    } catch (error) {
      if (error instanceof BusinessException) throw error;
      this.logger.error("阿里云短信验证异常", error instanceof Error ? error.stack : undefined);
      throw new BusinessException("短信验证服务暂不可用，请稍后重试");
    }
  }

  private getClient() {
    if (!this.client) {
      this.client = new Client({
        accessKeyId: this.getRequiredConfig("ALIYUN_ACCESS_KEY_ID"),
        accessKeySecret: this.getRequiredConfig("ALIYUN_ACCESS_KEY_SECRET"),
        endpoint: "dypnsapi.aliyuncs.com",
      } as any);
    }
    return this.client;
  }

  private getRequiredConfig(name: string) {
    const value = this.configService.get<string>(name)?.trim();
    if (!value) throw new BusinessException(`短信认证服务未配置：${name}`);
    return value;
  }
}
