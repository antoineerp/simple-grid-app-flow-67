
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
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-to-collaboration.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Inclure les fichiers de configuration de la base de données
require_once __DIR__ . '/config/DatabaseConfig.php';
require_once __DIR__ . '/config/DatabaseConnection.php';
require_once __DIR__ . '/config/database.php';

// Définir la fonction d'aide pour l'échappement SQL
function escapeTableName($name) {
    return '`' . str_replace('`', '``', $name) . '`';
}

try {
    // Créer une instance de Database pour gérer la connexion
    $db = new Database();
    $pdo = $db->getConnection(true);
    
    if (!$pdo) {
        throw new Exception("Erreur de connexion à la base de données");
    }
    
    // Obtenir la liste des tables pertinentes
    $stmt = $pdo->query("SHOW TABLES LIKE '%bibliotheque_%'");
    $bibliotheque_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $stmt = $pdo->query("SHOW TABLES LIKE '%collaboration_%'");
    $collaboration_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Résultat à retourner
    $result = [
        'status' => 'success',
        'message' => 'Analyse de la migration bibliotheque -> collaboration',
        'timestamp' => date('Y-m-d H:i:s'),
        'bibliotheque_tables' => $bibliotheque_tables,
        'collaboration_tables' => $collaboration_tables,
        'migration_status' => []
    ];
    
    // Vérifier le statut de chaque table bibliotheque
    foreach ($bibliotheque_tables as $table) {
        $user_id = str_replace('bibliotheque_', '', $table);
        $corresponding_table = "collaboration_" . $user_id;
        
        // Compter les enregistrements dans chaque table
        $stmt = $pdo->query("SELECT COUNT(*) FROM " . escapeTableName($table));
        $bibliotheque_count = $stmt->fetchColumn();
        
        // Vérifier si la table collaboration correspondante existe
        $collab_exists = in_array($corresponding_table, $collaboration_tables);
        $collab_count = 0;
        
        if ($collab_exists) {
            $stmt = $pdo->query("SELECT COUNT(*) FROM " . escapeTableName($corresponding_table));
            $collab_count = $stmt->fetchColumn();
        }
        
        $result['migration_status'][] = [
            'bibliotheque_table' => $table,
            'record_count' => $bibliotheque_count,
            'collaboration_table' => $corresponding_table,
            'collaboration_exists' => $collab_exists,
            'collaboration_count' => $collab_count,
            'migration_complete' => $collab_exists && $collab_count >= $bibliotheque_count
        ];
    }
    
    // Détails supplémentaires sur les tables
    $result['schema_details'] = [];
    
    // Obtenir les détails du schéma pour une table bibliotheque et la correspondante collaboration
    if (count($bibliotheque_tables) > 0) {
        $sample_bibliotheque = $bibliotheque_tables[0];
        $user_id = str_replace('bibliotheque_', '', $sample_bibliotheque);
        $sample_collaboration = "collaboration_" . $user_id;
        
        // Structure de la table bibliotheque
        $stmt = $pdo->query("DESCRIBE " . escapeTableName($sample_bibliotheque));
        $bibliotheque_schema = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Structure de la table collaboration si elle existe
        $collaboration_schema = [];
        if (in_array($sample_collaboration, $collaboration_tables)) {
            $stmt = $pdo->query("DESCRIBE " . escapeTableName($sample_collaboration));
            $collaboration_schema = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        $result['schema_details'] = [
            'bibliotheque_schema' => $bibliotheque_schema,
            'collaboration_schema' => $collaboration_schema
        ];
    }
    
    // Envoyer le rapport de migration
    echo json_encode($result, JSON_PRETTY_PRINT);
    error_log("=== FIN DE L'EXÉCUTION DE bibliotheque-to-collaboration.php ===");
    
} catch (Exception $e) {
    $error_message = "Erreur: " . $e->getMessage();
    error_log($error_message);
    
    echo json_encode([
        'status' => 'error',
        'message' => $error_message
    ], JSON_PRETTY_PRINT);
}
?>
