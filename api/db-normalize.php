
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DÉBUT DE L'EXÉCUTION DE db-normalize.php ===");

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
    
    // Récupérer toutes les tables
    $stmt = $pdo->query("SHOW TABLES");
    $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $normalizedTables = [];
    $tablesWithErrors = [];
    $tablesWithoutUserId = [];
    
    // Récupérer la liste de tous les utilisateurs
    $stmt = $pdo->query("SELECT identifiant_technique FROM utilisateurs");
    $userIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($allTables as $tableName) {
        // Ignorer les tables système
        if (in_array($tableName, ['utilisateurs'])) {
            continue;
        }
        
        try {
            // Vérifier si la table a une colonne userId
            $stmt = $pdo->prepare("SHOW COLUMNS FROM `{$tableName}` LIKE 'userId'");
            $stmt->execute();
            $hasUserIdColumn = $stmt->rowCount() > 0;
            
            if (!$hasUserIdColumn) {
                // Ajouter une colonne userId si elle n'existe pas
                error_log("Table {$tableName} n'a pas de colonne userId, ajout...");
                
                // Déterminer l'userId à partir du nom de la table
                $userId = null;
                foreach ($userIds as $id) {
                    if (strpos($tableName, $id) !== false) {
                        $userId = $id;
                        break;
                    }
                }
                
                if (!$userId) {
                    // Si aucun userId n'est trouvé dans le nom de la table, utiliser p71x6d_system par défaut
                    $userId = 'p71x6d_system';
                }
                
                try {
                    $pdo->exec("ALTER TABLE `{$tableName}` ADD COLUMN `userId` VARCHAR(50) NOT NULL DEFAULT '{$userId}'");
                    $normalizedTables[] = [
                        'name' => $tableName,
                        'action' => 'Ajout de colonne userId',
                        'new_value' => $userId
                    ];
                } catch (PDOException $alterError) {
                    error_log("Erreur lors de l'ajout de la colonne userId à {$tableName}: " . $alterError->getMessage());
                    $tablesWithoutUserId[] = $tableName;
                }
            } else {
                // Vérifier si des enregistrements ont une valeur userId vide
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM `{$tableName}` WHERE userId = '' OR userId IS NULL");
                $stmt->execute();
                $emptyUserIdCount = $stmt->fetchColumn();
                
                if ($emptyUserIdCount > 0) {
                    // Détecter l'userId à partir du nom de la table
                    $userId = null;
                    foreach ($userIds as $id) {
                        if (strpos($tableName, $id) !== false) {
                            $userId = $id;
                            break;
                        }
                    }
                    
                    if (!$userId) {
                        $userId = 'p71x6d_system';
                    }
                    
                    // Mettre à jour les enregistrements vides
                    $pdo->exec("UPDATE `{$tableName}` SET userId = '{$userId}' WHERE userId = '' OR userId IS NULL");
                    $normalizedTables[] = [
                        'name' => $tableName,
                        'action' => 'Mise à jour des userId vides',
                        'count' => $emptyUserIdCount,
                        'new_value' => $userId
                    ];
                }
            }
        } catch (PDOException $tableError) {
            error_log("Erreur lors de la normalisation de la table {$tableName}: " . $tableError->getMessage());
            $tablesWithErrors[] = [
                'name' => $tableName,
                'error' => $tableError->getMessage()
            ];
        }
    }
    
    // Réponse avec le statut de la normalisation
    echo json_encode([
        'success' => true,
        'message' => 'Normalisation des tables terminée',
        'tables_normalized' => $normalizedTables,
        'tables_with_errors' => $tablesWithErrors,
        'tables_without_userId' => $tablesWithoutUserId,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    error_log("PDOException dans db-normalize.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans db-normalize.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE db-normalize.php ===");
}
?>
