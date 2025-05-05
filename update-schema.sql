
-- Script de mise à jour du schéma de base de données pour l'application
-- Ce script supprime les tables existantes et les recrée avec les dernières définitions

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `identifiant_technique` VARCHAR(100) NOT NULL UNIQUE,
  `role` ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL DEFAULT 'utilisateur',
  `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tables pour stocker les documents
-- Note: Le suffixe _user_id sera ajouté automatiquement lors de la création par utilisateur
CREATE TABLE IF NOT EXISTS `documents_template` (
  `id` VARCHAR(36) PRIMARY KEY,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `contenu` LONGTEXT NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `statut` VARCHAR(20) DEFAULT 'brouillon',
  `groupId` VARCHAR(36) NULL,
  `fichier_path` VARCHAR(255) NULL,
  INDEX `idx_groupId` (`groupId`),
  INDEX `idx_statut` (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Groupes de documents
CREATE TABLE IF NOT EXISTS `document_groups_template` (
  `id` VARCHAR(36) PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `couleur` VARCHAR(20) NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tables pour les exigences
CREATE TABLE IF NOT EXISTS `exigences_template` (
  `id` VARCHAR(36) PRIMARY KEY,
  `nom` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `responsabilites` TEXT NULL,
  `exclusion` TINYINT(1) DEFAULT 0,
  `atteinte` ENUM('NC', 'PC', 'C') NULL,
  `groupId` VARCHAR(36) NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `priorite` VARCHAR(20) DEFAULT 'moyenne',
  INDEX `idx_groupId` (`groupId`),
  INDEX `idx_atteinte` (`atteinte`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Groupes d'exigences
CREATE TABLE IF NOT EXISTS `exigence_groups_template` (
  `id` VARCHAR(36) PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `couleur` VARCHAR(20) NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table membres (contacts, partenaires, etc.)
CREATE TABLE IF NOT EXISTS `membres_template` (
  `id` VARCHAR(36) PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NULL,
  `telephone` VARCHAR(20) NULL,
  `fonction` VARCHAR(100) NULL,
  `organisation` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de log pour l'activité des utilisateurs
CREATE TABLE IF NOT EXISTS `activite_utilisateur` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_timestamp` (`timestamp`),
  INDEX `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
