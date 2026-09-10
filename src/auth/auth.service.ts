import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import jwtConfig from "../config/jwt.config";
import { BusinessException } from "../common/exceptions/business.exception";
import { ErrorCode } from "../common/enums/error-code.enum";
import { ActionTypeValue } from "../common/enums/action-type.enum";
import { LogService } from "../system/log/log.service";
import { UserService } from "../system/user/user.service";
import type { LoginRequestDto } from "./dto/login-request.dto";
import { LoginResultDto } from "./dto/login-result.dto";
import { SysCaptcha } from "./entities/sys-captcha.entity";
import { SysLoginAttempt } from "./entities/sys-login-attempt.entity";
import { SysTokenBlacklist } from "./entities/sys-token-blacklist.entity";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_SECONDS = 60;

@Injectable()
export class AuthService {
  constructor(
    @Inject(jwtConfig.KEY) private readonly config: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly logService: LogService,
    @InjectRepository(SysCaptcha) private readonly captchaRepository: Repository<SysCaptcha>,
    @InjectRepository(SysLoginAttempt) private readonly loginAttemptRepository: Repository<SysLoginAttempt>,
    @InjectRepository(SysTokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<SysTokenBlacklist>
  ) {}

  async createCaptcha(captchaId: string, captchaText: string): Promise<void> {
    await this.captchaRepository.save({
      captchaId,
      captchaHash: await bcrypt.hash(captchaText.toUpperCase(), 10),
      expireTime: new Date(Date.now() + 120_000),
      isUsed: 0,
    });
  }

  async verifyCaptcha(captchaId: string, captchaCode: string): Promise<void> {
    const captcha = await this.captchaRepository.findOne({ where: { captchaId } });
    if (!captcha || captcha.isUsed === 1 || captcha.expireTime <= new Date()) {
      throw new BusinessException(ErrorCode.USER_VERIFICATION_CODE_EXPIRED);
    }
    if (!(await bcrypt.compare(captchaCode.toUpperCase(), captcha.captchaHash))) {
      throw new BusinessException(ErrorCode.USER_VERIFICATION_CODE_ERROR);
    }
    // 按约定保留“校验后标记已使用”的简单流程，不额外引入原子占用策略。
    captcha.isUsed = 1;
    await this.captchaRepository.save(captcha);
  }

  private async assertLoginAllowed(username: string, ip: string): Promise<void> {
    const attempt = await this.loginAttemptRepository.findOne({ where: { username, ip } });
    if (attempt && attempt.windowEnd > new Date() && attempt.failureCount >= LOGIN_LIMIT) {
      throw new BusinessException({
        code: ErrorCode.REQUEST_CONCURRENCY_LIMIT_EXCEEDED.code,
        msg: "登录失败次数过多，请稍后再试",
        httpStatus: 429,
      });
    }
  }

  private async recordLoginFailure(username: string, ip: string): Promise<void> {
    await this.loginAttemptRepository.query(
      `INSERT INTO sys_login_attempt (username, ip, failure_count, window_end)
       VALUES (?, ?, 1, DATE_ADD(NOW(), INTERVAL ${LOGIN_WINDOW_SECONDS} SECOND))
       ON DUPLICATE KEY UPDATE
         failure_count = IF(window_end <= NOW(), 1, failure_count + 1),
         window_end = IF(window_end <= NOW(), DATE_ADD(NOW(), INTERVAL ${LOGIN_WINDOW_SECONDS} SECOND), window_end)`,
      [username, ip]
    );
  }

  private async issueTokens(user: any): Promise<LoginResultDto> {
    const payload = {
      sub: user.id, username: user.username, deptId: user.deptId,
      dataScopes: user.dataScopes, deptTreePath: user.deptTreePath, roles: user.roles,
    };
    const accessToken = await this.jwtService.signAsync({ ...payload, jti: uuidv4() }, {
      expiresIn: this.config.expiresIn,
    });
    const refreshToken = await this.jwtService.signAsync({ ...payload, jti: uuidv4(), refreshToken: true }, {
      expiresIn: this.config.expiresIn * 10,
    });
    return { tokenType: "Bearer", accessToken, refreshToken, expiresIn: this.config.expiresIn };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.getAuthCredentialsByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) return null;
    const { password: _password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginRequestDto, ip: string, requestUri: string): Promise<LoginResultDto> {
    const { username, password } = loginDto;
    await this.assertLoginAllowed(username, ip);
    const user = await this.validateUser(username, password);
    if (!user) {
      await this.recordLoginFailure(username, ip);
      throw new BusinessException(ErrorCode.USER_PASSWORD_ERROR);
    }
    if (user.status === 0) throw new BusinessException(ErrorCode.ACCOUNT_FROZEN);
    await this.loginAttemptRepository.delete({ username, ip });
    const result = await this.issueTokens(user);
    this.logService.saveManualLog({
      actionType: ActionTypeValue.LOGIN, operatorId: user.id, operatorName: user.username,
      requestMethod: "POST", requestUri, status: 1,
    }).catch(() => {});
    return result;
  }

  async refreshToken(refreshToken: string): Promise<LoginResultDto> {
    if (!refreshToken) throw new BusinessException(ErrorCode.REQUEST_REQUIRED_PARAMETER_IS_EMPTY);
    try {
      const payload: any = await this.jwtService.verifyAsync(refreshToken, { secret: this.config.secretKey });
      if (!payload?.refreshToken || (await this.isJtiBlacklisted(payload.jti))) {
        throw new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID);
      }
      const accessToken = await this.jwtService.signAsync({
        sub: payload.sub, username: payload.username, deptId: payload.deptId,
        dataScopes: payload.dataScopes, deptTreePath: payload.deptTreePath,
        roles: payload.roles, jti: uuidv4(),
      }, { expiresIn: this.config.expiresIn });
      return { tokenType: "Bearer", accessToken, refreshToken, expiresIn: this.config.expiresIn };
    } catch {
      throw new BusinessException(ErrorCode.REFRESH_TOKEN_INVALID);
    }
  }

  async isJtiBlacklisted(jti?: string): Promise<boolean> {
    if (!jti) return true;
    return !!(await this.tokenBlacklistRepository.findOne({ where: { jti }, select: ["id"] }));
  }

  async blacklistToken(token: string): Promise<void> {
    const decoded: any = this.jwtService.decode(token.replace(/^Bearer\s+/i, ""));
    const jti: string | undefined = decoded?.jti;
    const exp: number | undefined = decoded?.exp;
    if (!jti || !exp || exp <= Math.floor(Date.now() / 1000)) return;
    await this.tokenBlacklistRepository.upsert({ jti, expireTime: new Date(exp * 1000) }, ["jti"]);
  }
}
