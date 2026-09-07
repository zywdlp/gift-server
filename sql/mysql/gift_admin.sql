-- 礼品兑换卡系统：全新部署初始化脚本
--
-- 用途：仅用于不保留任何历史数据的全新部署。
-- 警告：执行会永久删除 gift_admin 数据库及其中所有数据。
-- 执行顺序：
--   1. 执行本脚本，创建当前全部表、管理员、角色和最终菜单；
--   2. 将 .env 的 MYSQL_DB 配置为 gift_admin；
--   3. 保持 synchronize: false 后启动后端。

DROP DATABASE IF EXISTS `gift_admin`;
CREATE DATABASE `gift_admin` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gift_admin`;
SET NAMES utf8mb4;

-- 管理员账号与权限所需的基础表。
CREATE TABLE `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username` varchar(64) NOT NULL COMMENT '用户名',
  `nickname` varchar(64) NOT NULL COMMENT '昵称',
  `gender` tinyint NOT NULL DEFAULT 1 COMMENT '性别(1-男 2-女 0-保密)',
  `password` varchar(100) NOT NULL COMMENT '密码哈希',
  `dept_id` bigint DEFAULT NULL COMMENT '部门ID',
  `avatar` varchar(255) DEFAULT NULL COMMENT '用户头像',
  `mobile` varchar(20) DEFAULT NULL COMMENT '联系方式',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态(1-正常 0-禁用)',
  `email` varchar(128) DEFAULT NULL COMMENT '用户邮箱',
  `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '修改人ID',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识(0-未删除 1-已删除)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

CREATE TABLE `sys_role` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(64) NOT NULL COMMENT '角色名称',
  `code` varchar(32) NOT NULL COMMENT '角色编码',
  `sort` int DEFAULT NULL COMMENT '显示顺序',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '角色状态(1-正常 0-停用)',
  `data_scope` int DEFAULT NULL COMMENT '数据权限',
  `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '修改人ID',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识(0-未删除 1-已删除)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sys_role_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色表';

CREATE TABLE `sys_menu` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `parent_id` bigint NOT NULL COMMENT '父菜单ID',
  `tree_path` varchar(255) DEFAULT NULL COMMENT '父节点ID路径',
  `name` varchar(64) NOT NULL COMMENT '菜单名称',
  `type` char(1) NOT NULL COMMENT '菜单类型',
  `route_name` varchar(255) DEFAULT NULL COMMENT '路由名称',
  `route_path` varchar(128) DEFAULT NULL COMMENT '路由路径',
  `external_url` varchar(512) DEFAULT NULL COMMENT '外链地址',
  `component` varchar(128) DEFAULT NULL COMMENT '组件路径',
  `perm` varchar(128) DEFAULT NULL COMMENT '权限标识',
  `always_show` tinyint DEFAULT 0 COMMENT '是否始终显示',
  `keep_alive` tinyint DEFAULT 0 COMMENT '是否缓存页面',
  `visible` tinyint NOT NULL DEFAULT 1 COMMENT '显示状态',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `icon` varchar(64) DEFAULT NULL COMMENT '菜单图标',
  `redirect` varchar(128) DEFAULT NULL COMMENT '跳转路径',
  `params` json DEFAULT NULL COMMENT '路由参数',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统菜单表';

CREATE TABLE `sys_user_role` (
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  PRIMARY KEY (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

CREATE TABLE `sys_role_menu` (
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `menu_id` bigint NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (`role_id`, `menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联表';

-- 以下为当前后端全部实体表。全新部署不写入任何业务记录。
CREATE TABLE `sys_dept` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `name` varchar(100) NOT NULL COMMENT '部门名称', `code` varchar(100) NOT NULL COMMENT '部门编码',
  `parent_id` bigint NOT NULL DEFAULT 0 COMMENT '父部门ID', `tree_path` varchar(255) NOT NULL COMMENT '部门树路径', `sort` smallint NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态(1正常 0停用)', `create_by` bigint DEFAULT NULL COMMENT '创建人ID', `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间', `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`), UNIQUE KEY `uk_sys_dept_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门管理表';

CREATE TABLE `sys_role_dept` (
  `role_id` bigint NOT NULL COMMENT '角色ID', `dept_id` bigint NOT NULL COMMENT '部门ID', PRIMARY KEY (`role_id`, `dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色部门关联表';

CREATE TABLE `sys_dict` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `dict_code` varchar(50) DEFAULT NULL COMMENT '字典编码', `name` varchar(50) DEFAULT NULL COMMENT '字典名称',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态(1正常 0停用)', `remark` varchar(255) DEFAULT NULL COMMENT '备注', `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间', `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识', PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据字典类型表';

CREATE TABLE `sys_dict_item` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `dict_code` varchar(64) NOT NULL COMMENT '字典编码', `label` varchar(50) NOT NULL COMMENT '字典标签',
  `value` varchar(50) NOT NULL COMMENT '字典值', `sort` smallint NOT NULL DEFAULT 0 COMMENT '排序', `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态(1正常 0停用)',
  `tag_type` varchar(50) DEFAULT NULL COMMENT '标签类型', `remark` varchar(255) DEFAULT NULL COMMENT '备注', `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间', `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据字典项表';

CREATE TABLE `sys_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `module` tinyint NOT NULL COMMENT '业务模块', `action_type` tinyint NOT NULL COMMENT '操作类型',
  `title` varchar(100) DEFAULT NULL COMMENT '操作标题', `content` text DEFAULT NULL COMMENT '操作内容', `operator_id` bigint DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(50) DEFAULT NULL COMMENT '操作人名称', `request_uri` varchar(255) DEFAULT NULL COMMENT '请求路径',
  `request_method` varchar(10) DEFAULT NULL COMMENT '请求方法', `ip` varchar(45) DEFAULT NULL COMMENT 'IP地址', `province` varchar(100) DEFAULT NULL COMMENT '省份',
  `city` varchar(100) DEFAULT NULL COMMENT '城市', `device` varchar(100) DEFAULT NULL COMMENT '设备', `os` varchar(100) DEFAULT NULL COMMENT '操作系统',
  `browser` varchar(100) DEFAULT NULL COMMENT '浏览器', `status` tinyint DEFAULT NULL COMMENT '操作状态(1成功 0失败)', `error_msg` varchar(255) DEFAULT NULL COMMENT '错误信息',
  `execution_time` int DEFAULT NULL COMMENT '执行耗时(毫秒)', `create_time` datetime DEFAULT NULL COMMENT '创建时间', PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统操作日志表';

CREATE TABLE `sys_captcha` (
  `captcha_id` varchar(64) NOT NULL COMMENT '验证码ID', `captcha_hash` varchar(100) NOT NULL COMMENT '验证码哈希', `expire_time` datetime NOT NULL COMMENT '过期时间',
  `is_used` tinyint NOT NULL DEFAULT 0 COMMENT '是否已使用', PRIMARY KEY (`captcha_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图形验证码表';

CREATE TABLE `sys_login_attempt` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `username` varchar(64) NOT NULL COMMENT '登录账号', `ip` varchar(45) NOT NULL COMMENT 'IP地址',
  `failure_count` int NOT NULL DEFAULT 0 COMMENT '失败次数', `window_end` datetime NOT NULL COMMENT '限流窗口截止时间', PRIMARY KEY (`id`),
  UNIQUE KEY `uk_login_attempt_username_ip` (`username`, `ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='登录失败限流表';

CREATE TABLE `sys_token_blacklist` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `jti` varchar(64) NOT NULL COMMENT 'JWT唯一标识', `expire_time` datetime NOT NULL COMMENT '令牌过期时间',
  PRIMARY KEY (`id`), UNIQUE KEY `uk_token_blacklist_jti` (`jti`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='JWT令牌黑名单表';

CREATE TABLE `product` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `name` varchar(100) NOT NULL COMMENT '商品名称', `short_name` varchar(100) DEFAULT NULL COMMENT '商品简称',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '商品主图地址', `detail_images` json DEFAULT NULL COMMENT '商品详情图片地址列表',
  `reference_value` decimal(10,2) DEFAULT NULL COMMENT '参考价值', `description` text DEFAULT NULL COMMENT '商品详情',
  `delivery_scope` text DEFAULT NULL COMMENT '配送范围说明', `after_sales` text DEFAULT NULL COMMENT '售后说明', `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间', `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识', PRIMARY KEY (`id`),
  KEY `idx_product_name` (`name`), KEY `idx_product_deleted_time` (`is_deleted`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼品商品表';

CREATE TABLE `card_batch` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `batch_no` varchar(40) NOT NULL COMMENT '批次编号', `quantity` int unsigned NOT NULL COMMENT '生成数量',
  `request_id` varchar(64) NOT NULL COMMENT '幂等请求标识', `remark` varchar(255) DEFAULT NULL COMMENT '备注', `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间', `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识', PRIMARY KEY (`id`),
  UNIQUE KEY `uk_card_batch_batch_no` (`batch_no`), UNIQUE KEY `uk_card_batch_request_id` (`request_id`),
  KEY `idx_card_batch_deleted_time` (`is_deleted`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡密批次表';

CREATE TABLE `gift_card` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `card_no` varchar(32) NOT NULL COMMENT '卡号', `batch_id` bigint NOT NULL COMMENT '所属批次ID',
  `pin_hash` varchar(64) NOT NULL COMMENT 'PIN哈希值', `pin_ciphertext` text NOT NULL COMMENT 'PIN密文', `qr_token_hash` varchar(64) NOT NULL COMMENT '二维码令牌哈希值',
  `qr_token_ciphertext` text NOT NULL COMMENT '二维码令牌密文', `product_id` bigint DEFAULT NULL COMMENT '绑定商品ID', `product_snapshot` json DEFAULT NULL COMMENT '商品快照',
  `status` varchar(20) NOT NULL DEFAULT 'UNBOUND' COMMENT '卡状态', `expiry_at` datetime DEFAULT NULL COMMENT '兑换截止时间', `bound_at` datetime DEFAULT NULL COMMENT '绑定商品时间',
  `bind_remark` varchar(255) DEFAULT NULL COMMENT '绑定备注', `create_by` bigint DEFAULT NULL COMMENT '创建人ID', `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间', `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`), UNIQUE KEY `uk_gift_card_card_no` (`card_no`),
  UNIQUE KEY `uk_gift_card_qr_token_hash` (`qr_token_hash`), KEY `idx_gift_card_batch_id` (`batch_id`),
  KEY `idx_gift_card_deleted_time` (`is_deleted`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼品卡表';

CREATE TABLE `h5_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `phone_hash` varchar(64) NOT NULL COMMENT '手机号哈希值', `phone_ciphertext` text NOT NULL COMMENT '手机号密文',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态(1正常 0停用)', `create_by` bigint DEFAULT NULL COMMENT '创建人ID', `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间', `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`), UNIQUE KEY `uk_h5_user_phone_hash` (`phone_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='H5用户表';

CREATE TABLE `h5_sms_code` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `phone_hash` varchar(64) NOT NULL COMMENT '手机号哈希值', `code_hash` varchar(100) NOT NULL COMMENT '历史验证码哈希（兼容字段）',
  `expires_at` datetime NOT NULL COMMENT '历史验证码过期时间（兼容字段）', `sent_at` datetime DEFAULT NULL COMMENT '最近发送时间', `send_window_started_at` datetime NOT NULL COMMENT '发送限流窗口开始时间',
  `send_count` int NOT NULL DEFAULT 0 COMMENT '窗口内发送次数', `verify_failure_count` int NOT NULL DEFAULT 0 COMMENT '历史校验失败次数（兼容字段）', `is_used` tinyint NOT NULL DEFAULT 0 COMMENT '历史验证码使用标识（兼容字段）',
  PRIMARY KEY (`id`), UNIQUE KEY `uk_h5_sms_code_phone_hash` (`phone_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='H5短信发送限流表';

CREATE TABLE `redeem_session` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `token_hash` varchar(64) NOT NULL COMMENT '兑换会话令牌哈希值', `card_id` bigint NOT NULL COMMENT '礼品卡ID',
  `expires_at` datetime NOT NULL COMMENT '会话过期时间', `used_at` datetime DEFAULT NULL COMMENT '会话使用时间', `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间', `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识', PRIMARY KEY (`id`),
  UNIQUE KEY `uk_redeem_session_token_hash` (`token_hash`), KEY `idx_redeem_session_card_id` (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='兑换会话表';

CREATE TABLE `h5_pin_attempt` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `card_id` bigint NOT NULL COMMENT '礼品卡ID', `failed_count` int NOT NULL DEFAULT 0 COMMENT '失败次数',
  `window_started_at` datetime NOT NULL COMMENT '限流窗口开始时间', `blocked_until` datetime DEFAULT NULL COMMENT '锁定截止时间', `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间', `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识', PRIMARY KEY (`id`),
  UNIQUE KEY `uk_h5_pin_attempt_card_id` (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='H5 PIN验证限流表';

CREATE TABLE `redeem_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键', `order_no` varchar(32) NOT NULL COMMENT '订单号', `request_id` varchar(64) NOT NULL COMMENT '幂等请求标识',
  `card_id` bigint NOT NULL COMMENT '兑换礼品卡ID', `h5_user_id` bigint NOT NULL COMMENT '兑换人H5用户ID', `product_snapshot` json NOT NULL COMMENT '兑换商品快照',
  `status` varchar(20) NOT NULL DEFAULT 'PENDING_SHIPMENT' COMMENT '订单状态', `recipient` varchar(20) NOT NULL COMMENT '收件人',
  `phone_hash` varchar(64) NOT NULL COMMENT '收件手机号哈希值', `phone_ciphertext` text NOT NULL COMMENT '收件手机号密文', `region` json NOT NULL COMMENT '省市区地址',
  `address_detail` varchar(100) NOT NULL COMMENT '详细地址', `create_by` bigint DEFAULT NULL COMMENT '创建人ID', `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '更新人ID', `update_time` datetime DEFAULT NULL COMMENT '更新时间', `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`), UNIQUE KEY `uk_redeem_order_order_no` (`order_no`),
  UNIQUE KEY `uk_redeem_order_request_id` (`request_id`), UNIQUE KEY `uk_redeem_order_card_id` (`card_id`),
  KEY `idx_redeem_order_h5_user_id` (`h5_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼品兑换订单表';

-- 仅保留一个管理员。初始密码为 123456，请首次登录后立即修改。
INSERT INTO `sys_user`
  (`id`, `username`, `nickname`, `gender`, `password`, `status`, `create_time`, `update_time`, `is_deleted`)
VALUES
  (1, 'admin', '管理员', 0, '$2b$10$4/Ryp28JWL7yVrnakPXoxuILNuA7RvQ5LE7p6Cyy/cV9OARwcyTpC', 1, NOW(), NOW(), 0);

INSERT INTO `sys_role`
  (`id`, `name`, `code`, `sort`, `status`, `data_scope`, `create_time`, `update_time`, `is_deleted`)
VALUES
  (1, '管理员', 'ROOT', 1, 1, 1, NOW(), NOW(), 0);

INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES (1, 1);

-- 当前第一版正式菜单：不含权益方案、发放管理、旧卡批次和旧卡券菜单。
INSERT INTO `sys_menu`
  (`id`, `parent_id`, `tree_path`, `name`, `type`, `route_name`, `route_path`, `component`, `always_show`, `keep_alive`, `visible`, `sort`, `icon`, `create_time`, `update_time`)
VALUES
  (100, 0, '0', '商品管理', 'M', 'GiftProduct', '/products', 'gift/product/index', 0, 1, 1, 1, 'el-icon-Goods', NOW(), NOW()),
  (101, 0, '0', '卡密管理', 'M', 'GiftCardSecret', '/card-secrets', 'gift/card-secret/index', 0, 1, 1, 2, 'el-icon-Key', NOW(), NOW()),
  (102, 0, '0', '礼品卡管理', 'M', 'GiftCard', '/gift-cards', 'gift/card/index', 0, 1, 1, 3, 'el-icon-CreditCard', NOW(), NOW()),
  (106, 0, '0', '订单管理', 'M', 'GiftOrder', '/redeem-orders', 'gift/order/index', 0, 1, 1, 4, 'el-icon-Document', NOW(), NOW());

INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES
  (1, 100),
  (1, 101),
  (1, 102),
  (1, 106);
