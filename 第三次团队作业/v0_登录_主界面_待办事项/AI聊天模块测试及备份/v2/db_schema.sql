-- 新建数据库（名为 my_database）
CREATE DATABASE IF NOT EXISTS my_database CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE my_database;

-- 用户表（用于登录/注册）
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(32) NOT NULL UNIQUE,
  `password` VARCHAR(128) NOT NULL,
  `teamname` VARCHAR(128) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 任务表（事项看板）
CREATE TABLE IF NOT EXISTS `task` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `time` DATE DEFAULT NULL,
  `place` VARCHAR(255) DEFAULT NULL,
  `staff` VARCHAR(255) DEFAULT NULL,
  `something` TEXT,
  `urgency` TINYINT DEFAULT 1,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX (`user_id`),
  CONSTRAINT `fk_task_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 成员表（团队管理），tech_stack 不设置默认值（TEXT 列不能有默认）
CREATE TABLE IF NOT EXISTS `member` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `tech_stack` TEXT,
  PRIMARY KEY (`id`),
  INDEX (`user_id`),
  CONSTRAINT `fk_member_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;