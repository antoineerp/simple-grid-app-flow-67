
<?php
// Force output buffering to prevent output before headers
ob_start();

// Fichier pour diagnostiquer les tables des exigences
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE exigences-diagnostic.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

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
    $usersStmt = $pdo->query("SELECT id, nom, prenom, identifiant_technique, role FROM utilisateurs");
    $users = $usersStmt->fetchAll();
    
    // Récupérer toutes les tables commençant par "exigences_" et "exigence_groups_"
    $exigencesTablesStmt = $pdo->query("SHOW TABLES LIKE 'exigences_%'");
    $exigencesTables = $exigencesTablesStmt->fetchAll(PDO::FETCH_COLUMN);
    
    $groupsTablesStmt = $pdo->query("SHOW TABLES LIKE 'exigence_groups_%'");
    $groupsTables = $groupsTablesStmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Vérifier les colonnes pour chaque table
    $tablesInfo = [];
    
    foreach (array_merge($exigencesTables, $groupsTables) as $table) {
        try {
            $columnsStmt = $pdo->query("SHOW COLUMNS FROM `{$table}`");
            $columns = $columnsStmt->fetchAll(PDO::FETCH_COLUMN);
            
            $countStmt = $pdo->query("SELECT COUNT(*) FROM `{$table}`");
            $count = $countStmt->fetchColumn();
            
            $hasUserId = in_array('userId', $columns);
            
            $tablesInfo[$table] = [
                'exists' => true,
                'columns' => $columns,
                'records' => $count,
                'has_userId' => $hasUserId
            ];
            
            // Si la table n'a pas de colonne userId, essayons de l'ajouter
            if (!$hasUserId) {
                try {
                    $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN `userId` VARCHAR(50) NOT NULL DEFAULT 'p71x6d_system'");
                    $tablesInfo[$table]['added_userId'] = true;
                    error_log("Colonne userId ajoutée à la table {$table}");
                } catch (Exception $e) {
                    $tablesInfo[$table]['added_userId'] = false;
                    $tablesInfo[$table]['add_error'] = $e->getMessage();
                    error_log("Erreur lors de l'ajout de la colonne userId à {$table}: " . $e->getMessage());
                }
            }
        } catch (Exception $e) {
            $tablesInfo[$table] = [
                'exists' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    // Résultats du diagnostic
    $result = [
        'status' => 'success',
        'users' => $users,
        'exigences_tables' => $exigencesTables,
        'groups_tables' => $groupsTables,
        'tables_info' => $tablesInfo,
        'message' => 'Diagnostic des tables exigences effectué avec succès',
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans exigences-diagnostic.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans exigences-diagnostic.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE exigences-diagnostic.php ===");
}
?>
