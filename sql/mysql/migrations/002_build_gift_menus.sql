-- 已初始化数据库升级脚本：礼品业务一级菜单骨架。
-- 执行后重新登录，前端会重新拉取动态路由。
USE gift_admin;

-- 兼容本脚本早期目录版已被执行的情况：ID 105 是当时的重复发放管理子菜单。
DELETE FROM `sys_menu` WHERE `id` = 105;

INSERT INTO `sys_menu` (`id`, `parent_id`, `tree_path`, `name`, `type`, `route_name`, `route_path`, `component`, `perm`, `always_show`, `keep_alive`, `visible`, `sort`, `icon`, `redirect`, `create_time`, `update_time`, `params`) VALUES
  (100, 0, '0', '商品管理', 'M', 'GiftProduct', '/products', 'gift/product/index', NULL, 0, 1, 1, 1, 'gift', NULL, NOW(), NOW(), NULL),
  (101, 0, '0', '卡批次管理', 'M', 'GiftBatch', '/batches', 'gift/batch/index', NULL, 0, 1, 1, 2, 'table', NULL, NOW(), NOW(), NULL),
  (102, 0, '0', '卡券管理', 'M', 'GiftCard', '/cards', 'gift/card/index', NULL, 0, 1, 1, 3, 'qr-code', NULL, NOW(), NOW(), NULL),
  (103, 0, '0', '权益方案', 'M', 'GiftBenefitPlan', '/benefit-plans', 'gift/benefit-plan/index', NULL, 0, 1, 1, 4, 'document', NULL, NOW(), NOW(), NULL),
  (104, 0, '0', '发放管理', 'M', 'GiftAssignment', '/assignments', 'gift/assignment/index', NULL, 0, 1, 1, 5, 'group', NULL, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`), `tree_path` = VALUES(`tree_path`), `name` = VALUES(`name`),
  `type` = VALUES(`type`), `route_name` = VALUES(`route_name`), `route_path` = VALUES(`route_path`),
  `component` = VALUES(`component`), `perm` = VALUES(`perm`), `always_show` = VALUES(`always_show`),
  `keep_alive` = VALUES(`keep_alive`), `visible` = VALUES(`visible`), `sort` = VALUES(`sort`),
  `icon` = VALUES(`icon`), `redirect` = VALUES(`redirect`), `update_time` = NOW();

-- ROOT 管理员可读取上述全部一级菜单和后续按钮权限。
INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 100);
