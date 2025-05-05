
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Gérer uniquement les requêtes GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer l'ID utilisateur
$userId = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID utilisateur requis']);
    exit;
}

// Journaliser la requête
error_log("Chargement de la bibliothèque pour l'utilisateur: " . $userId);

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Nom de la table des documents pour cet utilisateur
    $tableName = "user_bibliotheque_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    $groupsTableName = "user_bibliotheque_groups_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    // Vérifier si la table existe
    $stmt = $conn->prepare("SHOW TABLES LIKE :tableName");
    $stmt->bindParam(':tableName', $tableName);
    $stmt->execute();
    
    $documents = [];
    $groups = [];
    
    // Récupérer tous les documents
    if ($stmt->rowCount() > 0) {
        $sql = "SELECT * FROM `$tableName`";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $document = [
                'id' => $row['id'],
                'name' => $row['name'],
                'link' => $row['link']
            ];
            
            // Ajouter le groupId s'il existe
            if ($row['group_id']) {
                $document['groupId'] = $row['group_id'];
            }
            
            $documents[] = $document;
        }
    }
    
    // Vérifier si la table des groupes existe
    $stmt = $conn->prepare("SHOW TABLES LIKE :groupsTableName");
    $stmt->bindParam(':groupsTableName', $groupsTableName);
    $stmt->execute();
    
    // Récupérer tous les groupes
    if ($stmt->rowCount() > 0) {
        $sql = "SELECT * FROM `$groupsTableName` ORDER BY `order`";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $group = [
                'id' => $row['id'],
                'name' => $row['name'],
                'expanded' => (bool)$row['expanded'],
                'items' => [] // Sera rempli côté client
            ];
            
            $groups[] = $group;
        }
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'documents' => $documents,
        'groups' => $groups,
        'count_documents' => count($documents),
        'count_groups' => count($groups)
    ]);
    
} catch (Exception $e) {
    error_log("Erreur lors du chargement de la bibliothèque: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
