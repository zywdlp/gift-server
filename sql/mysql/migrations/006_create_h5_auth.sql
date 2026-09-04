-- H5 短信登录：用户、验证码及 MySQL 限流数据。
USE gift_admin;

CREATE TABLE IF NOT EXISTS `h5_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `phone_hash` varchar(64) NOT NULL COMMENT '手机号摘要',
  `phone_ciphertext` text NOT NULL COMMENT '手机号密文',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态：1正常，0禁用',
  `create_by` bigint NULL COMMENT '创建人ID',
  `create_time` datetime NULL COMMENT '创建时间',
  `update_by` bigint NULL COMMENT '修改人ID',
  `update_time` datetime NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_h5_user_phone_hash` (`phone_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='H5用户表';

CREATE TABLE IF NOT EXISTS `h5_sms_code` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `phone_hash` varchar(64) NOT NULL COMMENT '手机号摘要',
  `code_hash` varchar(100) NOT NULL COMMENT '验证码摘要',
  `expires_at` datetime NOT NULL COMMENT '验证码过期时间',
  `sent_at` datetime NULL COMMENT '最近发送时间',
  `send_window_started_at` datetime NOT NULL COMMENT '发送统计窗口开始时间',
  `send_count` int NOT NULL DEFAULT 0 COMMENT '当前窗口发送次数',
  `verify_failure_count` int NOT NULL DEFAULT 0 COMMENT '验证码校验失败次数',
  `is_used` tinyint NOT NULL DEFAULT 0 COMMENT '是否已使用',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_h5_sms_code_phone_hash` (`phone_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='H5短信验证码表';
