import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "../system/user/user.module";
import { RoleModule } from "../system/role/role.module";
import { LogModule } from "../system/log/log.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { ToolsService } from "../common/utils/captcha.util";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SysUser } from "../system/user/entities/sys-user.entity";
import { SysCaptcha } from "./entities/sys-captcha.entity";
import { SysLoginAttempt } from "./entities/sys-login-attempt.entity";
import { SysTokenBlacklist } from "./entities/sys-token-blacklist.entity";

@Module({
  imports: [
    UserModule,
    RoleModule,
    LogModule,
    TypeOrmModule.forFeature([SysUser, SysCaptcha, SysLoginAttempt, SysTokenBlacklist]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.getOrThrow<string>("jwt.secretKey"),
        signOptions: {
          expiresIn: config.get<number>("jwt.expiresIn"),
          issuer: config.get<string>("jwt.issuer"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ToolsService],
  exports: [AuthService],
})
export class AuthModule {}
