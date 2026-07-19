-- SOAR 平台 MVP 核心表
-- 迁移版本: 000001

-- 用户表
CREATE TABLE IF NOT EXISTS `soar_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `account` VARCHAR(64) NOT NULL COMMENT '登录账号',
  `passwd` VARCHAR(128) NOT NULL COMMENT '密码（bcrypt）',
  `nick_name` VARCHAR(64) DEFAULT '' COMMENT '昵称',
  `email` VARCHAR(128) DEFAULT '' COMMENT '邮箱',
  `avatar` VARCHAR(255) DEFAULT '' COMMENT '头像路径',
  `status` TINYINT DEFAULT 0 COMMENT '0=启用，1=禁用',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '软删除',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_account` (`account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户账号';

-- 角色表
CREATE TABLE IF NOT EXISTS `soar_role` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL COMMENT '角色名',
  `description` VARCHAR(255) DEFAULT '' COMMENT '描述',
  `is_builtin` TINYINT DEFAULT 0 COMMENT '是否内置角色',
  `status` TINYINT DEFAULT 0 COMMENT '0=启用，1=禁用',
  `deleted_at` DATETIME DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色定义';

-- 用户-角色绑定表
CREATE TABLE IF NOT EXISTS `soar_user_role` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户-角色绑定';

-- 权限点注册表
CREATE TABLE IF NOT EXISTS `soar_permission` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(64) NOT NULL COMMENT '权限点编码，如 workflow:read',
  `name` VARCHAR(128) NOT NULL COMMENT '权限点名称',
  `description` VARCHAR(255) DEFAULT '' COMMENT '描述',
  `resource_type` VARCHAR(64) NOT NULL COMMENT '资源类型',
  `action` VARCHAR(32) NOT NULL COMMENT '动作',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限点注册表';

-- 角色-权限点绑定表
CREATE TABLE IF NOT EXISTS `soar_role_permission` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT NOT NULL,
  `permission_code` VARCHAR(64) NOT NULL,
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色-权限点绑定';

-- 剧本表
CREATE TABLE IF NOT EXISTS `soar_workflow` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(64) NOT NULL COMMENT '剧本 UUID',
  `type_id` INT DEFAULT 1 COMMENT '分类 ID',
  `user_id` INT NOT NULL COMMENT '创建者 ID',
  `name` VARCHAR(128) NOT NULL COMMENT '剧本名称',
  `flow_json` LONGTEXT COMMENT '图形化编排 JSON',
  `flow_data` LONGTEXT COMMENT '流程数据',
  `controller_data` LONGTEXT COMMENT '控制器数据',
  `local_var_data` LONGTEXT COMMENT '局部变量',
  `remarks` VARCHAR(255) DEFAULT '' COMMENT '备注',
  `status` TINYINT DEFAULT 0 COMMENT '0=草稿，1=已发布',
  `thumbnail` VARCHAR(255) DEFAULT '' COMMENT '缩略图路径',
  `deleted_at` DATETIME DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_uuid` (`uuid`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type_id` (`type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='剧本主表';

-- APP 元信息表
CREATE TABLE IF NOT EXISTS `soar_app` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(64) NOT NULL COMMENT 'APP 编码',
  `name` VARCHAR(128) NOT NULL COMMENT 'APP 名称',
  `version` VARCHAR(32) DEFAULT '0.1' COMMENT '版本',
  `type` VARCHAR(64) DEFAULT '' COMMENT '类型',
  `description` TEXT COMMENT '描述',
  `icon` VARCHAR(255) DEFAULT '' COMMENT '图标路径',
  `app_json` TEXT COMMENT 'app.json 原文',
  `group_id` INT DEFAULT 1 COMMENT '分组 ID',
  `status` TINYINT DEFAULT 0 COMMENT '0=启用，1=禁用',
  `deleted_at` DATETIME DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='APP 元信息';

-- 执行日志表
CREATE TABLE IF NOT EXISTS `soar_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exec_id` VARCHAR(64) NOT NULL COMMENT '执行 ID',
  `workflow_uuid` VARCHAR(64) NOT NULL COMMENT '关联剧本 UUID',
  `workflow_name` VARCHAR(128) DEFAULT '' COMMENT '剧本名称快照',
  `trigger_type` VARCHAR(32) DEFAULT 'manual' COMMENT '触发类型',
  `trigger_data` TEXT COMMENT '触发数据',
  `status` VARCHAR(32) DEFAULT 'running' COMMENT 'running/success/failed/timeout',
  `start_time` DATETIME COMMENT '开始时间',
  `end_time` DATETIME COMMENT '结束时间',
  `duration_ms` INT DEFAULT 0 COMMENT '执行耗时',
  `error` TEXT COMMENT '失败原因',
  `user_id` INT DEFAULT 0 COMMENT '触发者 ID',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_exec_id` (`exec_id`),
  KEY `idx_workflow_uuid` (`workflow_uuid`, `start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='执行历史';

-- 节点执行详情表
CREATE TABLE IF NOT EXISTS `soar_logs_detail` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exec_id` VARCHAR(64) NOT NULL COMMENT '关联执行 ID',
  `node_id` VARCHAR(64) NOT NULL COMMENT '节点 ID',
  `app_code` VARCHAR(64) DEFAULT '' COMMENT 'APP 编码',
  `action` VARCHAR(64) DEFAULT '' COMMENT '执行动作',
  `status` VARCHAR(32) DEFAULT 'pending' COMMENT 'pending/running/success/failed',
  `start_time` DATETIME COMMENT '开始时间',
  `end_time` DATETIME COMMENT '结束时间',
  `input` LONGTEXT COMMENT '输入参数 JSON',
  `output` LONGTEXT COMMENT '输出结果 JSON',
  `error` TEXT COMMENT '错误信息',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_exec_id` (`exec_id`, `node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='节点执行详情';

-- 系统配置表
CREATE TABLE IF NOT EXISTS `soar_setting` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(128) NOT NULL COMMENT '配置键',
  `value` TEXT COMMENT '配置值',
  `remarks` VARCHAR(255) DEFAULT '' COMMENT '配置说明',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 默认角色
INSERT INTO `soar_role` (`id`, `name`, `description`, `is_builtin`, `status`) VALUES
(1, 'super_admin', '超级管理员，拥有全部权限', 1, 0),
(2, 'workflow_editor', '剧本编辑者，可创建/编辑/执行剧本', 1, 0),
(3, 'workflow_executor', '仅可执行剧本', 1, 0),
(4, 'viewer', '只读用户', 1, 0);

-- 权限点
INSERT INTO `soar_permission` (`code`, `name`, `resource_type`, `action`) VALUES
('workflow:read', '查看剧本', 'workflow', 'read'),
('workflow:write', '创建/编辑剧本', 'workflow', 'write'),
('workflow:execute', '执行剧本', 'workflow', 'execute'),
('workflow:delete', '删除剧本', 'workflow', 'delete'),
('app:read', '查看 APP', 'app', 'read'),
('app:manage', '管理 APP', 'app', 'manage'),
('variable:read', '查看变量', 'variable', 'read'),
('variable:write', '创建/编辑变量', 'variable', 'write'),
('variable:delete', '删除变量', 'variable', 'delete'),
('timer:read', '查看定时器', 'timer', 'read'),
('timer:manage', '管理定时器', 'timer', 'manage'),
('user:read', '查看用户', 'user', 'read'),
('user:manage', '管理用户', 'user', 'manage'),
('role:read', '查看角色', 'role', 'read'),
('role:manage', '管理角色', 'role', 'manage'),
('audit:read', '查看审计日志', 'audit', 'read'),
('system:read', '查看系统设置', 'system', 'read'),
('system:write', '修改系统设置', 'system', 'write');

-- super_admin 角色拥有全部权限
INSERT INTO `soar_role_permission` (`role_id`, `permission_code`)
SELECT 1, code FROM `soar_permission`;

-- workflow_editor 权限
INSERT INTO `soar_role_permission` (`role_id`, `permission_code`) VALUES
(2, 'workflow:read'), (2, 'workflow:write'), (2, 'workflow:execute'), (2, 'workflow:delete'),
(2, 'app:read'), (2, 'app:manage'),
(2, 'variable:read'), (2, 'variable:write'), (2, 'variable:delete'),
(2, 'timer:read'), (2, 'timer:manage');

-- workflow_executor 权限
INSERT INTO `soar_role_permission` (`role_id`, `permission_code`) VALUES
(3, 'workflow:read'), (3, 'workflow:execute'),
(3, 'app:read'),
(3, 'variable:read'),
(3, 'timer:read');

-- viewer 权限
INSERT INTO `soar_role_permission` (`role_id`, `permission_code`) VALUES
(4, 'workflow:read'),
(4, 'app:read'),
(4, 'variable:read');

-- 默认管理员账号（密码: admin123）
INSERT INTO `soar_users` (`account`, `passwd`, `nick_name`, `status`) VALUES
('admin', '$2a$10$YlOl.ZWV2QCwyJMfnbgA4uxMN/K/YLXtWaF8fQ1bjoHosZSnXZIeO', '超级管理员', 0);

-- 绑定管理员角色
INSERT INTO `soar_user_role` (`user_id`, `role_id`) VALUES (1, 1);