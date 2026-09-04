-- H5 正式兑换订单。
USE gift_admin;

CREATE TABLE IF NOT EXISTS `redeem_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no` varchar(32) NOT NULL COMMENT '兑换订单号',
  `request_id` varchar(64) NOT NULL COMMENT '前端幂等请求标识',
  `card_id` bigint NOT NULL COMMENT '礼品卡ID',
  `h5_user_id` bigint NOT NULL COMMENT 'H5用户ID',
  `product_snapshot` json NOT NULL COMMENT '兑换商品快照',
  `status` varchar(20) NOT NULL DEFAULT 'PENDING_SHIPMENT' COMMENT '订单状态',
  `recipient` varchar(20) NOT NULL COMMENT '收件人',
  `phone_hash` varchar(64) NOT NULL COMMENT '收件手机号摘要',
  `phone_ciphertext` text NOT NULL COMMENT '收件手机号密文',
  `region` json NOT NULL COMMENT '省市区',
  `address_detail` varchar(100) NOT NULL COMMENT '详细地址',
  `create_by` bigint NULL COMMENT '创建人ID',
  `create_time` datetime NULL COMMENT '创建时间',
  `update_by` bigint NULL COMMENT '修改人ID',
  `update_time` datetime NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_redeem_order_order_no` (`order_no`),
  UNIQUE KEY `uk_redeem_order_request_id` (`request_id`),
  UNIQUE KEY `uk_redeem_order_card_id` (`card_id`),
  KEY `idx_redeem_order_h5_user_id` (`h5_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼品兑换订单表';
