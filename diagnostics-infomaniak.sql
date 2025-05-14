
-- Script de diagnostic et correction pour la base de données Infomaniak
-- À exécuter dans phpMyAdmin ou via SSH avec mysql

-- Vérifier les informations de la base de données
SELECT 
    VERSION() AS mysql_version,
    DATABASE() AS current_database,
    USER() AS current_user;

-- Créer une table de journalisation pour les opérations si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS db_operations_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operation_type VARCHAR(50) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT
);

-- Journaliser cette opération
INSERT INTO db_operations_log (operation_type, target_table, status, message)
VALUES ('diagnostic', 'all', 'started', 'Diagnostic complet démarré');

-- Vérifier l'encodage de la base de données
SELECT 
    DEFAULT_CHARACTER_SET_NAME AS charset,
    DEFAULT_COLLATION_NAME AS collation
FROM 
    information_schema.SCHEMATA 
WHERE 
    SCHEMA_NAME = DATABASE();

-- Vérifier si la table utilisateurs existe, sinon la créer
SELECT COUNT(*) INTO @table_exists FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utilisateurs';

SET @create_users_table = CONCAT('
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
    role ENUM("administrateur", "utilisateur", "gestionnaire") NOT NULL DEFAULT "utilisateur",
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
');

PREPARE create_users_stmt FROM @create_users_table;
EXECUTE create_users_stmt;
DEALLOCATE PREPARE create_users_stmt;

-- Vérifier si la table contient des utilisateurs, sinon créer un utilisateur par défaut
SELECT COUNT(*) INTO @user_count FROM utilisateurs;
SET @insert_admin = '
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role)
SELECT "Admin", "Système", "admin@system.local", "$2y$10$RKnYzs94o4ukCeHWw3sOp.ESc9w8LqUiEs2XGo.9bMRrqNYuZrKMK", "p71x6d_system", "administrateur"
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE identifiant_technique = "p71x6d_system");
';

PREPARE insert_admin_stmt FROM @insert_admin;
EXECUTE insert_admin_stmt;
DEALLOCATE PREPARE insert_admin_stmt;

-- Vérifier les tables qui doivent exister pour l'application
CREATE TABLE IF NOT EXISTS test_table (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Créer un index pour améliorer les performances
ALTER TABLE utilisateurs ADD INDEX IF NOT EXISTS idx_email (email);
ALTER TABLE utilisateurs ADD INDEX IF NOT EXISTS idx_identifiant (identifiant_technique);

-- Créer une table pour tester la synchronisation
CREATE TABLE IF NOT EXISTS sync_test (
    id VARCHAR(36) PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    data JSON,
    INDEX idx_device (device_id)
);

-- Insérer un enregistrement de test pour la synchronisation
INSERT INTO sync_test (id, device_id, status, data)
VALUES (
    UUID(), 
    'test_device',
    'success',
    '{"test": true, "message": "Synchronisation fonctionnelle"}'
);

-- Journaliser la fin de l'opération
INSERT INTO db_operations_log (operation_type, target_table, status, message)
VALUES ('diagnostic', 'all', 'completed', 'Diagnostic et correction terminés avec succès');

-- Afficher un résumé des opérations
SELECT 
    TABLE_NAME, 
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM 
    information_schema.TABLES 
WHERE 
    TABLE_SCHEMA = DATABASE()
ORDER BY CREATE_TIME DESC;

-- Afficher les journaux d'opérations
SELECT * FROM db_operations_log ORDER BY operation_date DESC LIMIT 10;
