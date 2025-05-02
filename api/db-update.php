
<?php
// Script de mise à jour des tables de la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DÉBUT DE L'EXÉCUTION DE db-update.php ===");

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Récupération de l'utilisateur demandé
    $userId = isset($_GET['userId']) ? $_GET['userId'] : 'p71x6d_system';
    error_log("Mise à jour des tables pour l'utilisateur: {$userId}");
    
    // Sécurisation de l'ID utilisateur pour éviter les injections SQL
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    
    // Liste des tables à mettre à jour avec leur structure
    $tables = [
        "bibliotheque" => [
            "id" => "VARCHAR(36) PRIMARY KEY",
            "nom" => "VARCHAR(255) NOT NULL",
            "description" => "TEXT NULL",
            "link" => "VARCHAR(255) NULL",
            "groupId" => "VARCHAR(36) NULL",
            "userId" => "VARCHAR(50) NOT NULL",
            "date_creation" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "date_modification" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ],
        "exigences" => [
            "id" => "VARCHAR(36) PRIMARY KEY",
            "nom" => "VARCHAR(255) NOT NULL",
            "responsabilites" => "TEXT",
            "exclusion" => "TINYINT(1) DEFAULT 0",
            "atteinte" => "ENUM('NC', 'PC', 'C') NULL",
            "groupId" => "VARCHAR(36) NULL",
            "userId" => "VARCHAR(50) NOT NULL",
            "date_creation" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "date_modification" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ],
        "membres" => [
            "id" => "VARCHAR(36) PRIMARY KEY",
            "nom" => "VARCHAR(100) NOT NULL",
            "prenom" => "VARCHAR(100) NOT NULL",
            "email" => "VARCHAR(255) NULL",
            "telephone" => "VARCHAR(20) NULL",
            "fonction" => "VARCHAR(100) NULL",
            "organisation" => "VARCHAR(255) NULL",
            "notes" => "TEXT NULL",
            "userId" => "VARCHAR(50) NOT NULL",
            "date_creation" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "date_modification" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ],
        "documents" => [
            "id" => "VARCHAR(36) PRIMARY KEY",
            "nom" => "VARCHAR(255) NOT NULL",
            "fichier_path" => "VARCHAR(255) NULL",
            "responsabilites" => "TEXT NULL",
            "etat" => "VARCHAR(50) NULL",
            "groupId" => "VARCHAR(36) NULL",
            "userId" => "VARCHAR(50) NOT NULL",
            "date_creation" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "date_modification" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ],
        "pilotage" => [
            "id" => "VARCHAR(36) PRIMARY KEY",
            "titre" => "VARCHAR(255) NOT NULL",
            "description" => "TEXT NULL",
            "statut" => "VARCHAR(50) NULL",
            "priorite" => "VARCHAR(50) NULL",
            "date_debut" => "DATE NULL",
            "date_fin" => "DATE NULL",
            "responsabilites" => "TEXT NULL",
            "userId" => "VARCHAR(50) NOT NULL",
            "date_creation" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "date_modification" => "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ]
    ];
    
    $tablesUpdated = [];
    $tablesCreated = [];
    
    // Création ou mise à jour des tables pour l'utilisateur
    foreach ($tables as $baseTableName => $columns) {
        $tableName = "{$baseTableName}_{$safeUserId}";
        error_log("Traitement de la table {$tableName}");
        
        // Vérifier si la table existe
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?");
        $stmt->execute([$dbname, $tableName]);
        $tableExists = (int)$stmt->fetchColumn() > 0;
        
        if ($tableExists) {
            error_log("La table {$tableName} existe déjà, vérification de la structure");
            
            // Récupération des colonnes existantes
            $stmt = $pdo->prepare("DESCRIBE `{$tableName}`");
            $stmt->execute();
            $existingColumns = [];
            while ($row = $stmt->fetch()) {
                $existingColumns[$row['Field']] = $row;
            }
            
            // Vérification et ajout des colonnes manquantes
            foreach ($columns as $columnName => $columnDefinition) {
                if (!isset($existingColumns[$columnName])) {
                    error_log("Ajout de la colonne {$columnName} à la table {$tableName}");
                    $pdo->exec("ALTER TABLE `{$tableName}` ADD COLUMN `{$columnName}` {$columnDefinition}");
                }
            }
            
            // Vérifier spécifiquement si la colonne userId existe
            if (!isset($existingColumns['userId'])) {
                error_log("Ajout de la colonne userId à la table {$tableName}");
                $pdo->exec("ALTER TABLE `{$tableName}` ADD COLUMN `userId` VARCHAR(50) NOT NULL");
                
                // Mettre à jour tous les enregistrements existants avec l'userId actuel
                $pdo->exec("UPDATE `{$tableName}` SET userId = '{$userId}' WHERE userId IS NULL OR userId = ''");
            }
            
            $tablesUpdated[] = $tableName;
        } else {
            error_log("Création de la table {$tableName}");
            
            // Création de la définition complète de la table
            $columnDefinitions = [];
            foreach ($columns as $columnName => $columnDefinition) {
                $columnDefinitions[] = "`{$columnName}` {$columnDefinition}";
            }
            
            $createTableQuery = "CREATE TABLE `{$tableName}` (\n    " . implode(",\n    ", $columnDefinitions) . "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            $pdo->exec($createTableQuery);
            
            $tablesCreated[] = $tableName;
        }
    }
    
    // Réponse avec le statut de la mise à jour
    echo json_encode([
        'success' => true,
        'message' => 'Mise à jour des tables terminée avec succès',
        'tables_created' => $tablesCreated,
        'tables_updated' => $tablesUpdated,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    error_log("PDOException dans db-update.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage(),
        'error_type' => 'PDOException'
    ]);
} catch (Exception $e) {
    error_log("Exception dans db-update.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage(),
        'error_type' => 'Exception'
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE db-update.php ===");
}
?>
