
<?php
// Script pour créer ou vérifier la table exigence_groups pour chaque utilisateur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DÉBUT DE L'EXÉCUTION DE create-exigence-groups-table.php ===");

try {
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Récupérer tous les utilisateurs
    $stmt = $pdo->query("SELECT identifiant_technique FROM utilisateurs");
    $users = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $tablesCreated = [];
    $tablesExist = [];
    $errors = [];
    
    // Pour chaque utilisateur, vérifier ou créer la table exigence_groups
    foreach ($users as $userId) {
        $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
        $tableName = "exigence_groups_" . $safeUserId;
        
        // Vérifier si la table existe déjà
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?");
        $stmt->execute([$dbname, $tableName]);
        $tableExists = (int)$stmt->fetchColumn() > 0;
        
        if ($tableExists) {
            $tablesExist[] = $tableName;
            error_log("Table {$tableName} existe déjà");
        } else {
            try {
                // Créer la table
                $createTableQuery = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `name` VARCHAR(255) NOT NULL,
                    `expanded` TINYINT(1) DEFAULT 1,
                    `userId` VARCHAR(50) NOT NULL,
                    `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
                $pdo->exec($createTableQuery);
                $tablesCreated[] = $tableName;
                error_log("Table {$tableName} créée avec succès");
            } catch (Exception $e) {
                $errors[] = [
                    'table' => $tableName,
                    'error' => $e->getMessage()
                ];
                error_log("Erreur lors de la création de la table {$tableName}: " . $e->getMessage());
            }
        }
    }
    
    // Vérifier aussi les tables exigences pour s'assurer qu'elles ont une colonne groupId
    $exigencesTables = [];
    $exigencesTablesStmt = $pdo->query("SHOW TABLES LIKE 'exigences_%'");
    while ($table = $exigencesTablesStmt->fetchColumn()) {
        try {
            // Vérifier si la colonne groupId existe
            $columnsStmt = $pdo->query("SHOW COLUMNS FROM `{$table}` LIKE 'groupId'");
            $groupIdExists = $columnsStmt->rowCount() > 0;
            
            if (!$groupIdExists) {
                // Ajouter la colonne groupId si elle n'existe pas
                $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN `groupId` VARCHAR(36) NULL");
                error_log("Colonne groupId ajoutée à la table {$table}");
            }
            
            // Vérifier si la colonne userId existe
            $columnsStmt = $pdo->query("SHOW COLUMNS FROM `{$table}` LIKE 'userId'");
            $userIdExists = $columnsStmt->rowCount() > 0;
            
            if (!$userIdExists) {
                // Ajouter la colonne userId si elle n'existe pas
                $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN `userId` VARCHAR(50) NOT NULL");
                error_log("Colonne userId ajoutée à la table {$table}");
            }
            
            $exigencesTables[] = [
                'table' => $table,
                'has_groupId' => $groupIdExists,
                'has_userId' => $userIdExists
            ];
            
        } catch (Exception $e) {
            $errors[] = [
                'table' => $table,
                'error' => $e->getMessage()
            ];
            error_log("Erreur lors de la vérification de la table {$table}: " . $e->getMessage());
        }
    }
    
    // Réponse avec le statut de la création des tables
    echo json_encode([
        'success' => true,
        'message' => 'Vérification et création des tables réussies',
        'users' => $users,
        'tables_created' => $tablesCreated,
        'tables_exist' => $tablesExist,
        'exigences_tables' => $exigencesTables,
        'errors' => $errors,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    error_log("PDOException dans create-exigence-groups-table.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage(),
        'error_type' => 'PDOException'
    ]);
} catch (Exception $e) {
    error_log("Exception dans create-exigence-groups-table.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage(),
        'error_type' => 'Exception'
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE create-exigence-groups-table.php ===");
}
?>
