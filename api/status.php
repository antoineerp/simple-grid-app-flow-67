
<?php
require_once 'config.php';

try {
    $pdo = getDbConnection();
    $userId = getUserId();
    
    // Vérifier les tables utilisateur
    $tables = [
        "documents_{$userId}",
        "exigences_{$userId}",
        "groupes_documents_{$userId}",
        "groupes_exigences_{$userId}"
    ];
    
    $tableStatus = [];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM {$table}");
            $result = $stmt->fetch();
            $tableStatus[$table] = ['exists' => true, 'count' => $result['count']];
        } catch (Exception $e) {
            $tableStatus[$table] = ['exists' => false, 'error' => $e->getMessage()];
        }
    }
    
    echo json_encode([
        'success' => true,
        'user_id' => $userId,
        'database' => DB_NAME,
        'tables' => $tableStatus,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de statut: ' . $e->getMessage()
    ]);
}
?>
