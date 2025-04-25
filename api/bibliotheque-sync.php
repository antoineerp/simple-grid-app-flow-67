
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Gérer uniquement les requêtes POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer les données envoyées
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

// Vérifier si le décodage JSON a fonctionné
if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données JSON invalides: ' . json_last_error_msg()]);
    exit;
}

// Vérifier les paramètres requis
if (!isset($input['userId']) || !isset($input['documents']) || !isset($input['groups'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Paramètres manquants (userId, documents ou groups)']);
    exit;
}

// Extraire les paramètres
$userId = $input['userId'];
$documents = $input['documents'];
$groups = $input['groups'];

// Journaliser la requête
error_log("Synchronisation de la bibliothèque pour l'utilisateur: " . $userId);
error_log("Nombre de documents: " . count($documents));
error_log("Nombre de groupes: " . count($groups));

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();
    
    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }
    
    // Noms des tables pour cet utilisateur
    $tableName = "user_bibliotheque_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    $groupsTableName = "user_bibliotheque_groups_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    // Commencer une transaction
    $conn->beginTransaction();
    
    // Créer ou recréer la table des documents
    $sql = "DROP TABLE IF EXISTS `$tableName`";
    $conn->exec($sql);
    
    $sql = "CREATE TABLE `$tableName` (
        `id` VARCHAR(100) NOT NULL,
        `name` VARCHAR(255) NOT NULL,
        `link` TEXT,
        `group_id` VARCHAR(100),
        `order` INT DEFAULT 0,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $conn->exec($sql);
    
    // Créer ou recréer la table des groupes
    $sql = "DROP TABLE IF EXISTS `$groupsTableName`";
    $conn->exec($sql);
    
    $sql = "CREATE TABLE `$groupsTableName` (
        `id` VARCHAR(100) NOT NULL,
        `name` VARCHAR(255) NOT NULL,
        `expanded` TINYINT(1) DEFAULT 0,
        `order` INT DEFAULT 0,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $conn->exec($sql);
    
    // Insérer les documents
    $insertDocSql = "INSERT INTO `$tableName` (id, name, link, group_id, `order`) VALUES (:id, :name, :link, :groupId, :order)";
    $docStmt = $conn->prepare($insertDocSql);
    
    $order = 0;
    foreach ($documents as $document) {
        $docStmt->bindParam(':id', $document['id']);
        $docStmt->bindParam(':name', $document['name']);
        $docStmt->bindParam(':link', $document['link']);
        
        // GroupId pourrait être null
        if (isset($document['groupId']) && $document['groupId']) {
            $docStmt->bindParam(':groupId', $document['groupId']);
        } else {
            $nullValue = null;
            $docStmt->bindParam(':groupId', $nullValue, PDO::PARAM_NULL);
        }
        
        $docStmt->bindParam(':order', $order);
        $order++;
        $docStmt->execute();
    }
    
    // Insérer les groupes
    $insertGroupSql = "INSERT INTO `$groupsTableName` (id, name, expanded, `order`) VALUES (:id, :name, :expanded, :order)";
    $groupStmt = $conn->prepare($insertGroupSql);
    
    $order = 0;
    foreach ($groups as $group) {
        $expanded = isset($group['expanded']) && $group['expanded'] ? 1 : 0;
        
        $groupStmt->bindParam(':id', $group['id']);
        $groupStmt->bindParam(':name', $group['name']);
        $groupStmt->bindParam(':expanded', $expanded);
        $groupStmt->bindParam(':order', $order);
        $order++;
        $groupStmt->execute();
        
        // Si le groupe a des éléments, les ajouter à la table des documents
        if (isset($group['items']) && is_array($group['items'])) {
            $subOrder = 0;
            foreach ($group['items'] as $item) {
                $docStmt->bindParam(':id', $item['id']);
                $docStmt->bindParam(':name', $item['name']);
                $docStmt->bindParam(':link', $item['link']);
                $docStmt->bindParam(':groupId', $group['id']);
                $docStmt->bindParam(':order', $subOrder);
                $subOrder++;
                $docStmt->execute();
            }
        }
    }
    
    // Valider la transaction
    $conn->commit();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Bibliothèque synchronisée avec succès',
        'documents_count' => count($documents),
        'groups_count' => count($groups)
    ]);
    
} catch (Exception $e) {
    // En cas d'erreur, annuler la transaction
    if (isset($conn)) {
        $conn->rollBack();
    }
    
    error_log("Erreur lors de la synchronisation de la bibliothèque: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
