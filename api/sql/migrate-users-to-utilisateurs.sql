
-- Ce script vérifie d'abord si la table "users" existe et, si c'est le cas, migre les données vers "utilisateurs"

-- 1. Vérifier si la table users existe
SET @users_exists = (SELECT COUNT(*) FROM information_schema.tables 
                     WHERE table_schema = 'p71x6d_richard' AND table_name = 'users');

-- 2. Si users existe, créer utilisateurs si elle n'existe pas
SET @create_utilisateurs = CONCAT('
  CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
    role ENUM("administrateur", "utilisateur", "gestionnaire") NOT NULL DEFAULT "utilisateur",
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
');

PREPARE create_stmt FROM @create_utilisateurs;
EXECUTE create_stmt;
DEALLOCATE PREPARE create_stmt;

-- 3. Si users existe, migrer les données
SET @migration_query = CONCAT('
  INSERT IGNORE INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation)
  SELECT 
    last_name, 
    first_name, 
    email, 
    password, 
    username, 
    CASE 
      WHEN role = "admin" THEN "administrateur"
      ELSE "utilisateur"
    END,
    created_at
  FROM users
  WHERE email NOT IN (SELECT email FROM utilisateurs);
');

-- Exécuter la migration uniquement si users existe
DELIMITER //
BEGIN
  IF @users_exists > 0 THEN
    PREPARE migration_stmt FROM @migration_query;
    EXECUTE migration_stmt;
    DEALLOCATE PREPARE migration_stmt;
    
    -- Enregistrer l'opération dans un journal
    CREATE TABLE IF NOT EXISTS migrations_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      operation VARCHAR(100),
      execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20),
      message TEXT
    );
    
    INSERT INTO migrations_log (operation, status, message)
    VALUES ('migrate_users_to_utilisateurs', 'success', 'Migration des données de users vers utilisateurs effectuée avec succès');
  END IF;
END //
DELIMITER ;
