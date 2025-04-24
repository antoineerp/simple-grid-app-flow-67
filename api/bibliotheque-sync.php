
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

// Récupérer les données POST
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Vérifier que les données sont valides
if (!$data || !isset($data['userId']) || !isset($data['documents']) || !isset($data['groups'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données invalides']);
    exit;
}

// Journaliser la requête
error_log("Synchronisation de la bibliothèque pour l'utilisateur: " . $data['userId']);
error_log("Nombre de documents à synchroniser: " . count($data['documents']));
error_log("Nombre de groupes à synchroniser: " . count($data['groups']));

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Créer la table des documents si elle n'existe pas
    $userId = $data['userId'];
    $tableName = "user_bibliotheque_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    $createTableSQL = "CREATE TABLE IF NOT EXISTS `$tableName` (
        `id` varchar(50) NOT NULL,
        `name` varchar(255) NOT NULL,
        `link` varchar(255) DEFAULT NULL,
        `group_id` varchar(50) DEFAULT NULL,
        `date_creation` datetime DEFAULT NULL,
        `date_modification` datetime DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $stmt = $conn->prepare($createTableSQL);
    $stmt->execute();
    
    // Créer la table des groupes si elle n'existe pas
    $groupsTableName = "user_bibliotheque_groups_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    $createGroupsTableSQL = "CREATE TABLE IF NOT EXISTS `$groupsTableName` (
        `id` varchar(50) NOT NULL,
        `name` varchar(255) NOT NULL,
        `expanded` tinyint(1) DEFAULT 1,
        `order` int(11) DEFAULT 0,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $stmt = $conn->prepare($createGroupsTableSQL);
    $stmt->execute();

    // Exécuter une transaction pour assurer l'intégrité des données
    $conn->beginTransaction();

    // 1. Sauvegarde des documents
    // Effacer d'abord tous les documents pour cet utilisateur
    $stmt_delete = $conn->prepare("DELETE FROM `$tableName`");
    $stmt_delete->execute();

    // Préparer la requête d'insertion/mise à jour des documents
    $sql = "INSERT INTO `$tableName` 
            (id, name, link, group_id, date_creation, date_modification) 
            VALUES (:id, :name, :link, :group_id, :date_creation, :date_modification)";
    
    $stmt = $conn->prepare($sql);

    // Insérer ou mettre à jour chaque document
    foreach ($data['documents'] as $document) {
        $stmt->bindParam(':id', $document['id']);
        $stmt->bindParam(':name', $document['name']);
        $link = $document['link'] ?? null;
        $stmt->bindParam(':link', $link);
        $group_id = $document['groupId'] ?? null;
        $stmt->bindParam(':group_id', $group_id);
        
        // Convertir les dates en format MySQL si nécessaire
        $date_creation = date('Y-m-d H:i:s');
        $stmt->bindParam(':date_creation', $date_creation);
        $date_modification = date('Y-m-d H:i:s');
        $stmt->bindParam(':date_modification', $date_modification);
        
        $stmt->execute();
    }

    // 2. Sauvegarde des groupes
    // Effacer d'abord tous les groupes pour cet utilisateur
    $stmt_delete_groups = $conn->prepare("DELETE FROM `$groupsTableName`");
    $stmt_delete_groups->execute();

    // Préparer la requête d'insertion/mise à jour des groupes
    $sql_groups = "INSERT INTO `$groupsTableName` 
                  (id, name, expanded, `order`) 
                  VALUES (:id, :name, :expanded, :order)";
    
    $stmt_groups = $conn->prepare($sql_groups);

    // Insérer ou mettre à jour chaque groupe
    foreach ($data['groups'] as $index => $group) {
        $stmt_groups->bindParam(':id', $group['id']);
        $stmt_groups->bindParam(':name', $group['name']);
        $expanded = $group['expanded'] ? 1 : 0;
        $stmt_groups->bindParam(':expanded', $expanded);
        $order = $index;
        $stmt_groups->bindParam(':order', $order);
        
        $stmt_groups->execute();
    }

    // Valider la transaction
    $conn->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'Bibliothèque synchronisée avec succès', 
        'count_documents' => count($data['documents']),
        'count_groups' => count($data['groups'])
    ]);
    
} catch (Exception $e) {
    // En cas d'erreur, annuler toute modification en cours
    if (isset($conn) && $conn->inTransaction()) {
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
