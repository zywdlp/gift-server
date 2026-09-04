import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { H5User } from "./entities/h5-user.entity";
import { H5SmsCode } from "./entities/h5-sms-code.entity";
import { H5AuthController } from "./h5-auth.controller";
import { H5AuthService } from "./h5-auth.service";
import { AliyunSmsAuthService } from "./aliyun-sms-auth.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([H5User, H5SmsCode]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.getOrThrow<string>("jwt.secretKey"),
        signOptions: { expiresIn: config.get<number>("jwt.expiresIn") },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [H5AuthController],
  providers: [H5AuthService, AliyunSmsAuthService],
})
export class H5AuthModule {}
