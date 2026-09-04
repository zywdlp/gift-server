-- H5 PIN 验证：短期兑换会话与服务端 PIN 限流记录。
USE gift_admin;

CREATE TABLE IF NOT EXISTS `redeem_session` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `token_hash` varchar(64) NOT NULL COMMENT '兑换会话令牌摘要',
  `card_id` bigint NOT NULL COMMENT '礼品卡ID',
  `expires_at` datetime NOT NULL COMMENT '会话过期时间',
  `used_at` datetime NULL COMMENT '使用时间',
  `create_by` bigint NULL COMMENT '创建人ID',
  `create_time` datetime NULL COMMENT '创建时间',
  `update_by` bigint NULL COMMENT '更新人ID',
  `update_time` datetime NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_redeem_session_token_hash` (`token_hash`),
  KEY `idx_redeem_session_card_id` (`card_id`),
  KEY `idx_redeem_session_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='H5兑换会话表';

CREATE TABLE IF NOT EXISTS `h5_pin_attempt` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `card_id` bigint NOT NULL COMMENT '礼品卡ID',
  `failed_count` int NOT NULL DEFAULT 0 COMMENT '当前窗口失败次数',
  `window_started_at` datetime NOT NULL COMMENT '失败统计窗口开始时间',
  `blocked_until` datetime NULL COMMENT '限制截止时间',
  `create_by` bigint NULL COMMENT '创建人ID',
  `create_time` datetime NULL COMMENT '创建时间',
  `update_by` bigint NULL COMMENT '更新人ID',
  `update_time` datetime NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_h5_pin_attempt_card_id` (`card_id`),
  KEY `idx_h5_pin_attempt_blocked_until` (`blocked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='H5 PIN验证限流表';
