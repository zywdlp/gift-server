/*
 * @LastEditors: zyw@decard.com
 * @Date: 2026-09-01 16:28:09
 * @LastEditTime: 2026-09-04 11:24:06
 * @Description: 
 */
import { registerAs } from "@nestjs/config";
import { resolveRuntimeConfig } from "./runtime.config";

export default registerAs("typeorm", () => {
  const { isProduction } = resolveRuntimeConfig();
  const synchronize = process.env.TYPEORM_SYNCHRONIZE === "true";
  if (isProduction && synchronize) {
    throw new Error("[TypeORM Config] 生产环境禁止开启 TYPEORM_SYNCHRONIZE");
  }

  const required = (envKey: string, label: string) => {
    const value = process.env[envKey];
    if (!value) {
      throw new Error(`[TypeORM Config] 环境变量 ${envKey}(${label}) 未配置，请检查 .env 文件`);
    }
    return value;
  };

  return {
    type: "mysql" as const,
    host: required("MYSQL_HOST", "数据库主机"),
    port: Number(required("MYSQL_PORT", "数据库端口")),
    username: required("MYSQL_USER", "数据库账号"),
    password: required("MYSQL_PASSWORD", "数据库密码"),
    database: required("MYSQL_DB", "数据库名称"),
    autoLoadEntities: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    synchronize,
    logging: process.env.TYPEORM_LOGGING === "false" ? false : true,
  };
});
