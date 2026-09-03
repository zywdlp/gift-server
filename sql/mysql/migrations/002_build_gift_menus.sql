-- 礼品系统第一版业务菜单：商品管理、卡密管理。
-- 可重复执行。执行后请退出并重新登录，以重新拉取动态路由。
USE gift_admin;
SET NAMES utf8mb4;

-- 第一版尚未开发卡券、权益方案和发放管理，清理其菜单及角色关联。
DELETE FROM `sys_role_menu` WHERE `menu_id` IN (102, 103, 104, 105);
DELETE FROM `sys_menu` WHERE `id` IN (102, 103, 104, 105);

INSERT INTO `sys_menu` (`id`, `parent_id`, `tree_path`, `name`, `type`, `route_name`, `route_path`, `component`, `perm`, `always_show`, `keep_alive`, `visible`, `sort`, `icon`, `redirect`, `create_time`, `update_time`, `params`) VALUES
  (100, 0, '0', '商品管理', 'M', 'GiftProduct', '/products', 'gift/product/index', NULL, 0, 1, 1, 1, 'gift', NULL, NOW(), NOW(), NULL),
  (101, 0, '0', '卡密管理', 'M', 'GiftBatch', '/card-secrets', 'gift/batch/index', NULL, 0, 1, 1, 2, 'table', NULL, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`), `tree_path` = VALUES(`tree_path`), `name` = VALUES(`name`),
  `type` = VALUES(`type`), `route_name` = VALUES(`route_name`), `route_path` = VALUES(`route_path`),
  `component` = VALUES(`component`), `perm` = VALUES(`perm`), `always_show` = VALUES(`always_show`),
  `keep_alive` = VALUES(`keep_alive`), `visible` = VALUES(`visible`), `sort` = VALUES(`sort`),
  `icon` = VALUES(`icon`), `redirect` = VALUES(`redirect`), `update_time` = NOW();

-- 第一版不使用按钮权限，只关联两个业务菜单。
INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 100), (1, 101);
