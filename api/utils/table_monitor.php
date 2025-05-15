
<?php
header("Content-Type: text/plain; charset=UTF-8");

/**
 * Script de surveillance des tables et activation du suivi automatique
 * Ce script est conçu pour être exécuté périodiquement via un cron job sur Infomaniak
 */

// Configuration de base
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/Logger.php';

// Journalisation
$logger = new Logger('table_monitor');
$logger->info("Début de la surveillance des tables");

// Connexion à la base de données
try {
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }
    
    $logger->info("Connexion à la base de données réussie");
    
    // Récupérer la liste des utilisateurs
    $stmt = $db->query("SELECT identifiant_technique FROM utilisateurs WHERE status = 'active'");
    $users = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $logger->info("Nombre d'utilisateurs actifs trouvés: " . count($users));
    
    // Récupérer les tables existantes
    $stmt = $db->query("SHOW TABLES");
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $logger->info("Nombre de tables existantes: " . count($existingTables));
    
    // Liste des tables de base à surveiller
    $baseTables = [
        'membres',
        'documents',
        'exigences',
        'bibliotheque',
        'collaboration'
    ];
    
    $tablesCreated = 0;
    $tablesUpdated = 0;
    
    // Pour chaque utilisateur, vérifier et créer les tables spécifiques si nécessaire
    foreach ($users as $userId) {
        $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
        $logger->info("Traitement de l'utilisateur: {$userId} (sécurisé: {$safeUserId})");
        
        foreach ($baseTables as $baseTable) {
            $userSpecificTable = "{$baseTable}_{$safeUserId}";
            
            // Vérifier si la table existe déjà
            if (!in_array($userSpecificTable, $existingTables)) {
                $logger->info("Création de la table {$userSpecificTable}");
                
                // Créer la table en fonction de son type
                switch ($baseTable) {
                    case 'membres':
                        $db->exec("CREATE TABLE IF NOT EXISTS `{$userSpecificTable}` (
                            `id` VARCHAR(36) PRIMARY KEY,
                            `nom` VARCHAR(100) NOT NULL,
                            `prenom` VARCHAR(100) NOT NULL,
                            `email` VARCHAR(255) NULL,
                            `telephone` VARCHAR(20) NULL,
                            `fonction` VARCHAR(100) NULL,
                            `organisation` VARCHAR(255) NULL,
                            `notes` TEXT NULL,
                            `initiales` VARCHAR(10) NULL,
                            `userId` VARCHAR(50) NOT NULL,
                            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
                        break;
                        
                    case 'documents':
                        $db->exec("CREATE TABLE IF NOT EXISTS `{$userSpecificTable}` (
                            `id` VARCHAR(36) PRIMARY KEY,
                            `titre` VARCHAR(255) NOT NULL,
                            `description` TEXT NULL,
                            `contenu` TEXT NULL,
                            `type` VARCHAR(50) NULL,
                            `statut` VARCHAR(50) DEFAULT 'brouillon',
                            `reference` VARCHAR(100) NULL,
                            `userId` VARCHAR(50) NOT NULL,
                            `groupId` VARCHAR(36) NULL,
                            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
                        break;
                        
                    case 'exigences':
                        $db->exec("CREATE TABLE IF NOT EXISTS `{$userSpecificTable}` (
                            `id` VARCHAR(36) PRIMARY KEY,
                            `numero` VARCHAR(50) NOT NULL,
                            `description` TEXT NOT NULL,
                            `indicateur` TEXT NULL,
                            `niveau` VARCHAR(50) NULL,
                            `statut` VARCHAR(50) DEFAULT 'à traiter',
                            `proprietaire` VARCHAR(100) NULL,
                            `userId` VARCHAR(50) NOT NULL,
                            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
                        break;
                        
                    case 'bibliotheque':
                    case 'collaboration':
                        $db->exec("CREATE TABLE IF NOT EXISTS `{$userSpecificTable}` (
                            `id` VARCHAR(36) PRIMARY KEY,
                            `titre` VARCHAR(255) NOT NULL,
                            `description` TEXT NULL,
                            `type_document` VARCHAR(50) NULL,
                            `chemin_fichier` VARCHAR(255) NULL,
                            `tags` TEXT NULL,
                            `userId` VARCHAR(50) NOT NULL,
                            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
                        break;
                }
                
                $tablesCreated++;
                
                // Activer le suivi de la table dans PHPMyAdmin
                try {
                    $db->exec("INSERT IGNORE INTO `pma__tracking` 
                              (db_name, table_name, version, date_created, date_updated, schema_snapshot, schema_sql, data_sql, tracking)
                              VALUES 
                              ('p71x6d_system', '{$userSpecificTable}', '1', NOW(), NOW(), '', '', '', 'UPDATE,INSERT,DELETE')");
                } catch (Exception $e) {
                    $logger->error("Impossible d'activer le suivi pour {$userSpecificTable}: " . $e->getMessage());
                }
            } else {
                // La table existe, vérifier si elle a besoin d'être mise à jour avec une colonne userId
                try {
                    $stmt = $db->query("SHOW COLUMNS FROM `{$userSpecificTable}` LIKE 'userId'");
                    if ($stmt->rowCount() === 0) {
                        $logger->info("Ajout de la colonne userId à {$userSpecificTable}");
                        $db->exec("ALTER TABLE `{$userSpecificTable}` ADD COLUMN `userId` VARCHAR(50) NOT NULL AFTER `id`");
                        $db->exec("UPDATE `{$userSpecificTable}` SET `userId` = '{$userId}' WHERE `userId` IS NULL OR `userId` = ''");
                        $tablesUpdated++;
                    }
                } catch (Exception $e) {
                    $logger->error("Erreur lors de la vérification/mise à jour de {$userSpecificTable}: " . $e->getMessage());
                }
            }
        }
    }
    
    $logger->info("Surveillance terminée: {$tablesCreated} tables créées, {$tablesUpdated} tables mises à jour");
    echo "Surveillance terminée: {$tablesCreated} tables créées, {$tablesUpdated} tables mises à jour\n";
    
} catch (Exception $e) {
    $logger->error("Erreur globale: " . $e->getMessage());
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>
