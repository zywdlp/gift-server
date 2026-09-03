<div align="center">

# gift-server

**礼品管理后台基础服务**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue?logo=apache)](LICENSE)

</div>

## 项目简介

`gift-server` 是礼品管理系统的后端基础服务，提供账号密码与图形验证码登录、RBAC 权限、部门数据权限、字典及操作日志能力。

## 核心特性

- 🔐 **安全体系** — 纯 JWT、令牌续期与 MySQL 黑名单失效机制
- 🛡️ **细粒度权限** — RBAC 权限模型，菜单/按钮/接口统一治理
- 📦 **核心模块** — 用户、角色、菜单、部门、字典、操作日志
- 🔐 **简洁认证** — 账号密码 + 图形验证码登录

## 快速开始

**环境要求**：Node.js 20+ · pnpm · MySQL 8.0+

1. 导入数据库：`sql/mysql/gift_admin.sql`
2. 创建本地配置：复制 `.env.example` 为 `.env`，并填写本机 MySQL 与 JWT 密钥。
3. 安装依赖：`pnpm install`
4. 启动服务：

   **方式一：WebStorm 启动（推荐）**
   用 WebStorm 打开项目，等待依赖索引完成，运行 `start:dev` 启动配置即可。

   **方式二：命令行启动**
   ```bash
   pnpm run start:dev
   ```
   启动后访问 [http://localhost:8000/api-docs](http://localhost:8000/api-docs)，能打开接口文档即说明后端已正常运行。


## 目录结构

```
gift-server/
├── src/                            # 核心业务源码
│   ├── main.ts                     # 应用入口
│   ├── app.module.ts               # 根模块
│   ├── auth/                       # 认证与鉴权模块
│   ├── system/                     # 系统核心模块（用户/角色/菜单/部门/字典/日志）
│   ├── common/                     # 公共能力（守卫/拦截器/过滤器/异常）
│   ├── config/                     # 应用运行配置
│   └── types/                      # 类型定义
├── sql/                            # 数据库初始化脚本
├── .env.example                    # 不含密钥的环境配置模板
└── package.json                    # 项目配置与脚本
```

