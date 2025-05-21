
<?php
// Fichier pour récupérer des données de tables spécifiques à un utilisateur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Récupérer les paramètres
$table = isset($_GET['table']) ? $_GET['table'] : '';
$userId = isset($_GET['userId']) ? $_GET['userId'] : '';
$action = isset($_GET['action']) ? $_GET['action'] : 'fetch'; // Default action is fetch

if (empty($table) || empty($userId)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Les paramètres table et userId sont requis'
    ]);
    exit;
}

// Normaliser le nom de la table avec l'ID utilisateur
$safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
$tableName = "{$table}_{$safeUserId}";

try {
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    // Connexion à la base de données
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Gérer le POST pour la synchronisation
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'sync') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (!$data || !isset($data['documents'])) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Données invalides pour la synchronisation'
            ]);
            exit;
        }
        
        // Vérifier si la table existe, sinon la créer
        $stmt = $pdo->prepare("SHOW TABLES LIKE :tableName");
        $stmt->bindParam(':tableName', $tableName, PDO::PARAM_STR);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            // Créer la table si elle n'existe pas
            $pdo->exec("CREATE TABLE `{$tableName}` (
                `id` VARCHAR(36) PRIMARY KEY,
                `json_data` TEXT,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
        }
        
        // Insertion ou mise à jour des documents
        $pdo->beginTransaction();
        try {
            $updateStmt = $pdo->prepare("INSERT INTO `{$tableName}` (`id`, `json_data`) VALUES (:id, :json_data) 
                                         ON DUPLICATE KEY UPDATE `json_data` = :json_data_update");
            
            $count = 0;
            foreach ($data['documents'] as $doc) {
                if (!isset($doc['id'])) continue;
                
                $jsonData = json_encode($doc, JSON_UNESCAPED_UNICODE);
                
                $updateStmt->bindParam(':id', $doc['id'], PDO::PARAM_STR);
                $updateStmt->bindParam(':json_data', $jsonData, PDO::PARAM_STR);
                $updateStmt->bindParam(':json_data_update', $jsonData, PDO::PARAM_STR);
                $updateStmt->execute();
                
                $count++;
            }
            
            $pdo->commit();
            
            echo json_encode([
                'status' => 'success',
                'message' => "Synchronisation réussie",
                'count' => $count
            ]);
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
    
    // Procéder avec GET pour la récupération des données
    // Vérifier si la table existe
    $stmt = $pdo->prepare("SHOW TABLES LIKE :tableName");
    $stmt->bindParam(':tableName', $tableName, PDO::PARAM_STR);
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        // Récupérer les données
        $stmt = $pdo->prepare("SELECT * FROM `{$tableName}`");
        $stmt->execute();
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Analyse de la structure JSON pour une présentation structurée
        $data = [];
        foreach ($records as $record) {
            if (isset($record['json_data'])) {
                try {
                    $jsonData = json_decode($record['json_data'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $data[] = [
                            'id' => $record['id'] ?? null,
                            'data' => $jsonData,
                            'created_at' => $record['created_at'] ?? null,
                            'updated_at' => $record['updated_at'] ?? null
                        ];
                    } else {
                        $data[] = $record;
                    }
                } catch (Exception $e) {
                    $data[] = $record;
                }
            } else {
                $data[] = $record;
            }
        }
        
        echo json_encode([
            'status' => 'success',
            'table' => $tableName,
            'records' => $data,
            'raw_records' => $records,
            'count' => count($records)
        ]);
    } else {
        // Vérifier les tables associées qui pourraient contenir des données
        $likePattern = "%{$table}%";
        $stmt = $pdo->prepare("SHOW TABLES LIKE :likePattern");
        $stmt->bindParam(':likePattern', $likePattern, PDO::PARAM_STR);
        $stmt->execute();
        $relatedTables = [];
        
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $relatedTables[] = $row[0];
        }
        
        // Si des tables associées existent, essayer de récupérer les données
        $relatedData = [];
        foreach ($relatedTables as $relTable) {
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM `{$relTable}`");
            $stmt->execute();
            $count = $stmt->fetchColumn();
            
            if ($count > 0) {
                $stmt = $pdo->prepare("SELECT * FROM `{$relTable}` LIMIT 10");
                $stmt->execute();
                $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $relatedData[$relTable] = [
                    'count' => $count,
                    'sample_data' => $records
                ];
            } else {
                $relatedData[$relTable] = [
                    'count' => 0,
                    'message' => 'Table vide'
                ];
            }
        }
        
        echo json_encode([
            'status' => 'success',
            'table' => $tableName,
            'exists' => false,
            'message' => "La table {$tableName} n'existe pas",
            'related_tables' => $relatedTables,
            'related_data' => $relatedData
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de base de données: ' . $e->getMessage(),
        'table' => $tableName,
        'userId' => $userId
    ]);
}
?>
