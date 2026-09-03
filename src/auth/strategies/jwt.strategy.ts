import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { RoleService } from "../../system/role/role.service";
import { AuthService } from "../auth.service";

/**
 * JWT 认证策略
 *
 * 解析并验证 JWT 令牌，将令牌载荷转换为标准化的用户对象
 * 处理令牌过期、签名有效性等底层验证
 *
 * 注意：权限标识（perms）不在此处获取，而是在权限守卫中从 MySQL 动态读取。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly roleService: RoleService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("jwt.secretKey"),
    });
  }

  /**
   * 验证并标准化 JWT 载荷
   *
   * @param payload 解码后的 JWT 载荷
   * @returns 标准用户对象 (将挂载到 req.user)
   */
  async validate(payload: any) {
    if (!payload.sub || !payload.username) {
      throw new UnauthorizedException("无效的令牌载荷");
    }

    const userId = payload.sub;
    if (await this.authService.isJtiBlacklisted(payload.jti)) {
      throw new UnauthorizedException("Token 已失效，请重新登录");
    }

    const roles: string[] = payload.roles || [];

    // 获取角色的数据权限列表
    const dataScopes = await this.roleService.getRoleDataScopes(roles);

    return {
      userId,
      username: payload.username,
      roles,
      deptId: payload.deptId,
      dataScopes,
      deptTreePath: payload.deptTreePath,
    };
  }
}
