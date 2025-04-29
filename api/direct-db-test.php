
<?php
// Script de test direct de la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DÉBUT DU TEST DE CONNEXION À LA BASE DE DONNÉES ===");

try {
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    // Récupérer des informations sur le serveur
    $server_info = [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Inconnu',
        'request_time' => date('Y-m-d H:i:s'),
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Inconnue',
        'http_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Inconnu'
    ];
    
    // Vérifier les extensions PHP requises
    $php_extensions = [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'json' => extension_loaded('json'),
        'mbstring' => extension_loaded('mbstring'),
        'curl' => extension_loaded('curl')
    ];
    
    // Tenter une connexion à la base de données
    $db_info = [];
    try {
        $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        $db_version = $pdo->query('SELECT VERSION()')->fetchColumn();
        $db_info = [
            'connected' => true,
            'version' => $db_version
        ];
    } catch (PDOException $e) {
        $db_info = [
            'connected' => false,
            'error' => $e->getMessage()
        ];
    }
    
    // Vérifier les tableaux existants pour l'utilisateur system
    $tables = [];
    $userId = 'p71x6d_system';
    
    if ($db_info['connected']) {
        $expectedTables = ['bibliotheque', 'documents', 'exigences', 'membres', 'pilotage'];
        
        foreach ($expectedTables as $baseTable) {
            $fullTableName = "{$baseTable}_{$userId}";
            try {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?");
                $stmt->execute([$dbname, $fullTableName]);
                $exists = (int)$stmt->fetchColumn() > 0;
                
                if ($exists) {
                    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM `{$fullTableName}`");
                    $countStmt->execute();
                    $count = $countStmt->fetchColumn();
                    
                    $tables[$fullTableName] = [
                        'exists' => true,
                        'record_count' => (int)$count
                    ];
                } else {
                    $tables[$fullTableName] = [
                        'exists' => false,
                        'record_count' => 0
                    ];
                }
            } catch (PDOException $e) {
                $tables[$fullTableName] = [
                    'exists' => false,
                    'error' => $e->getMessage()
                ];
            }
        }
    }
    
    // Compiler toutes les informations et renvoyer le résultat
    echo json_encode([
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => $server_info,
        'php_extensions' => $php_extensions,
        'database' => $db_info,
        'tables' => $tables
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("Exception dans le test de connexion: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Erreur lors du test de connexion: ' . $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DU TEST DE CONNEXION À LA BASE DE DONNÉES ===");
}
?>
