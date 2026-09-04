USE gift_admin;
SET NAMES utf8mb4;
INSERT INTO `sys_menu` (`id`,`parent_id`,`tree_path`,`name`,`type`,`route_name`,`route_path`,`component`,`perm`,`always_show`,`keep_alive`,`visible`,`sort`,`icon`,`redirect`,`create_time`,`update_time`,`params`) VALUES (106,0,'0','订单管理','M','GiftOrder','/redeem-orders','gift/order/index',NULL,0,1,1,4,'list',NULL,NOW(),NOW(),NULL) ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`route_name`=VALUES(`route_name`),`route_path`=VALUES(`route_path`),`component`=VALUES(`component`),`visible`=VALUES(`visible`),`sort`=VALUES(`sort`),`icon`=VALUES(`icon`),`update_time`=NOW();
INSERT IGNORE INTO `sys_role_menu` (`role_id`,`menu_id`) VALUES (1,106);
