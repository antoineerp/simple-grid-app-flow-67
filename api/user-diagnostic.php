
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE user-diagnostic.php ===");
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
    
    // Vérifier la table des utilisateurs
    $stmt = $pdo->query("SELECT * FROM utilisateurs");
    $users = $stmt->fetchAll();
    
    // Récupérer la liste des tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Analyser les tables par préfixe
    $tablesByPrefix = [];
    foreach ($tables as $table) {
        $parts = explode('_', $table);
        if (count($parts) > 1) {
            $prefix = $parts[0];
            if (!isset($tablesByPrefix[$prefix])) {
                $tablesByPrefix[$prefix] = [];
            }
            $tablesByPrefix[$prefix][] = $table;
        }
    }
    
    // Résultat à retourner
    $result = [
        'status' => 'success',
        'message' => 'Diagnostic des utilisateurs et tables',
        'users' => $users,
        'tables' => $tables,
        'tables_by_prefix' => $tablesByPrefix,
        'user_tables' => []
    ];
    
    // Vérifier les tables pour chaque utilisateur
    foreach ($users as $user) {
        $userId = $user['identifiant_technique'];
        $userTables = [];
        
        foreach ($tables as $table) {
            if (strpos($table, '_' . $userId) !== false) {
                $userTables[] = $table;
            }
        }
        
        $result['user_tables'][$userId] = $userTables;
    }
    
    // Envoyer le rapport
    echo json_encode($result, JSON_PRETTY_PRINT);
    error_log("=== FIN DE L'EXÉCUTION DE user-diagnostic.php ===");
    
} catch (Exception $e) {
    $error_message = "Erreur: " . $e->getMessage();
    error_log($error_message);
    
    echo json_encode([
        'status' => 'error',
        'message' => $error_message
    ]);
}
?>
