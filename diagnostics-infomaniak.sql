
-- Script de diagnostic pour la base de données MySQL sur Infomaniak
-- À exécuter dans phpMyAdmin ou tout autre client MySQL

-- Vérifier les informations de la base de données
SELECT 
    VERSION() AS mysql_version,
    DATABASE() AS current_database,
    USER() AS currentuser;

-- Vérifier les privilèges de l'utilisateur actuel
SHOW GRANTS;

-- Vérifier les tables dans la base de données actuelle
SHOW TABLES;

-- Créer une table de diagnostic si elle n'existe pas
CREATE TABLE IF NOT EXISTS infomaniak_diagnostic (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL,
    test_result TINYINT(1) NOT NULL,
    test_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer un résultat de test
INSERT INTO infomaniak_diagnostic (test_name, test_result, test_message)
VALUES ('connexion_test', 1, 'Connexion à la base de données réussie via MySQL direct');

-- Vérifier si une table importante existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'utilisateurs')
        THEN 'Table utilisateurs existe'
        ELSE 'Table utilisateurs n''existe pas'
    END AS table_status;

-- Récupérer des informations sur l'encodage de la base de données
SELECT 
    DEFAULT_CHARACTER_SET_NAME AS charset,
    DEFAULT_COLLATION_NAME AS collation
FROM 
    information_schema.SCHEMATA 
WHERE 
    SCHEMA_NAME = DATABASE();

-- Afficher les dernières entrées de diagnostic
SELECT * FROM infomaniak_diagnostic ORDER BY timestamp DESC LIMIT 5;
