-- 卡密管理第一版：全新批次与卡密数据结构。
-- 若已存在任何旧版 card_batch、gift_card 表，请先删除旧表后再执行本脚本。
-- 请在数据库工具中以 UTF-8 编码执行。
USE gift_admin;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `card_batch` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `batch_no` varchar(40) NOT NULL COMMENT '批次编号',
  `quantity` int unsigned NOT NULL COMMENT '生成数量',
  `request_id` varchar(64) NOT NULL COMMENT '幂等请求标识',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '修改人ID',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_card_batch_batch_no` (`batch_no`),
  UNIQUE KEY `uk_card_batch_request_id` (`request_id`),
  KEY `idx_card_batch_deleted_time` (`is_deleted`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡密批次表';

CREATE TABLE IF NOT EXISTS `gift_card` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `card_no` varchar(32) NOT NULL COMMENT '卡号',
  `batch_id` bigint NOT NULL COMMENT '批次ID',
  `pin_hash` varchar(64) NOT NULL COMMENT 'PIN摘要',
  `pin_ciphertext` text NOT NULL COMMENT 'PIN密文',
  `qr_token_hash` varchar(64) NOT NULL COMMENT '二维码令牌摘要',
  `qr_token_ciphertext` text NOT NULL COMMENT '二维码令牌密文',
  `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '更新人ID',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_gift_card_card_no` (`card_no`),
  UNIQUE KEY `uk_gift_card_qr_token_hash` (`qr_token_hash`),
  KEY `idx_gift_card_batch_id` (`batch_id`),
  KEY `idx_gift_card_deleted_time` (`is_deleted`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼品卡密表';
