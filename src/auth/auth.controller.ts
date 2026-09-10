import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Delete,
} from "@nestjs/common";

import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/login-request.dto";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LoginResultDto } from "./dto/login-result.dto";
import { Public } from "../common/decorators/auth.decorator";
import { Log } from "../common/decorators/log.decorator";
import { ActionTypeValue } from "../common/enums/action-type.enum";
import { LogModuleValue } from "../common/enums/log-module.enum";
import { ToolsService } from "../common/utils/captcha.util";
import { v4 as uuidv4 } from "uuid";

/**
 * 认证接口控制器
 */
@ApiTags("01.认证中心")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly toolsService: ToolsService
  ) {}

  @ApiOperation({ summary: "登录接口" })
  @ApiOkResponse({ type: LoginResultDto })
  @Public()
  @Post("login")
  async login(@Req() req: any, @Body() loginDto: LoginRequestDto) {
    const { captchaCode, captchaId } = loginDto;
    await this.authService.verifyCaptcha(captchaId, captchaCode);
    return await this.authService.login(
      loginDto,
      req.ip || req.socket?.remoteAddress || "unknown",
      req.originalUrl || req.url,
    );
  }

  @ApiOperation({ summary: "注销登录" })
  @Log(LogModuleValue.LOGIN, ActionTypeValue.LOGOUT)
  @Delete("logout")
  async logout(@Req() req: any) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring("Bearer ".length);
      // 将当前 JWT 的 jti 写入 MySQL 黑名单。
      await this.authService.blacklistToken(token);
    }

    // 清除用户信息
    req["user"] = null;
    // 向客户端返回成功的响应
    return null;
  }

  @ApiOperation({ summary: "获取验证码" })
  @Public()
  @Get("captcha")
  async getCode() {
    const svgCaptcha = await this.toolsService.captche();
    const captchaId = uuidv4();
    await this.authService.createCaptcha(captchaId, svgCaptcha.captcha.text);
    return {
      captchaBase64: svgCaptcha.base64,
      captchaId,
    };
  }

  @ApiOperation({ summary: "刷新令牌" })
  @Public()
  @Post("refresh-token")
  async refreshToken(@Body("refreshToken") refreshToken: string) {
    return await this.authService.refreshToken(refreshToken);
  }

}
