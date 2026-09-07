-- 礼品兑换卡系统：MySQL 应用账号创建模板。
--
-- 请使用 MySQL 管理员账号执行；执行前务必替换密码和生产后端服务器 IP。
-- 本文件不负责建库或建表，数据库初始化请执行 init_gift.sql。
-- 应用账号仅授予业务运行所需的 SELECT、INSERT、UPDATE、DELETE 权限。

-- 开发环境：后端与 MySQL 在同一台开发机器时使用。
CREATE USER IF NOT EXISTS 'gift_user_dev'@'localhost' IDENTIFIED BY 'xiaohui@2026';
CREATE USER IF NOT EXISTS 'gift_user_dev'@'127.0.0.1' IDENTIFIED BY 'xiaohui@2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON `gift_platform`.* TO 'gift_user_dev'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `gift_platform`.* TO 'gift_user_dev'@'127.0.0.1';

-- -- 生产环境：将 BACKEND_SERVER_IP 替换为生产后端服务器的内网 IP。
-- CREATE USER IF NOT EXISTS 'gift_user_prod'@'BACKEND_SERVER_IP' IDENTIFIED BY 'REPLACE_WITH_PROD_STRONG_PASSWORD';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON `gift_platform`.* TO 'gift_user_prod'@'BACKEND_SERVER_IP';

FLUSH PRIVILEGES;
