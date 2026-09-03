-- 礼品卡管理第一版：为已生成的 gift_card 表补充商品绑定字段。
-- 请在执行过 003_create_card_batch.sql 的 gift_admin 数据库中执行一次。
USE gift_admin;

ALTER TABLE `gift_card`
  ADD COLUMN `product_id` bigint NULL COMMENT '绑定商品ID' AFTER `batch_id`,
  ADD COLUMN `product_snapshot` json NULL COMMENT '绑定时的商品快照' AFTER `product_id`,
  ADD COLUMN `status` varchar(20) NOT NULL DEFAULT 'UNBOUND' COMMENT '卡片状态：UNBOUND未绑定，ACTIVE可兑换' AFTER `product_snapshot`,
  ADD COLUMN `expiry_at` datetime NULL COMMENT '兑换截止时间' AFTER `status`,
  ADD COLUMN `bound_at` datetime NULL COMMENT '商品绑定时间' AFTER `expiry_at`,
  ADD COLUMN `bind_remark` varchar(255) NULL COMMENT '商品绑定备注' AFTER `bound_at`,
  ADD KEY `idx_gift_card_product_id` (`product_id`),
  ADD KEY `idx_gift_card_status` (`status`);
