-- 已初始化数据库升级脚本：商品管理一期。执行一次即可，不会删除已有数据。
USE gift_admin;

CREATE TABLE IF NOT EXISTS `product` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(100) NOT NULL COMMENT '商品名称',
  `short_name` varchar(100) DEFAULT NULL COMMENT '商品简称',
  `cover_image` varchar(500) DEFAULT NULL COMMENT '商品主图地址',
  `detail_images` json DEFAULT NULL COMMENT '商品详情图片地址',
  `reference_value` decimal(10,2) DEFAULT NULL COMMENT '参考价值',
  `description` text DEFAULT NULL COMMENT '商品详情',
  `delivery_scope` text DEFAULT NULL COMMENT '配送范围',
  `after_sales` text DEFAULT NULL COMMENT '售后说明',
  `create_by` bigint DEFAULT NULL COMMENT '创建人ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` bigint DEFAULT NULL COMMENT '修改人ID',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '逻辑删除标识(0-未删除 1-已删除)',
  PRIMARY KEY (`id`),
  KEY `idx_product_name` (`name`),
  KEY `idx_product_deleted_time` (`is_deleted`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼品商品表';
