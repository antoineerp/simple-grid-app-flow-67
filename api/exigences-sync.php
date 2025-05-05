
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
if (!$data || !isset($data['userId']) || !isset($data['exigences'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données invalides']);
    exit;
}

// Journaliser la requête
error_log("Synchronisation des exigences pour l'utilisateur: " . $data['userId']);
error_log("Nombre d'exigences à synchroniser: " . count($data['exigences']));

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Créer la table des exigences si elle n'existe pas
    $userId = $data['userId'];
    $tableName = "user_exigences_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    $createTableSQL = "CREATE TABLE IF NOT EXISTS `$tableName` (
        `id` varchar(50) NOT NULL,
        `nom` varchar(255) NOT NULL,
        `exclusion` tinyint(1) DEFAULT 0,
        `atteinte` varchar(10) DEFAULT NULL,
        `responsabilites` text,
        `group_id` varchar(50) DEFAULT NULL,
        `date_creation` datetime DEFAULT NULL,
        `date_modification` datetime DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $stmt = $conn->prepare($createTableSQL);
    $stmt->execute();
    
    // Créer la table des groupes si elle n'existe pas
    $groupsTableName = "user_exigence_groups_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    $createGroupsTableSQL = "CREATE TABLE IF NOT EXISTS `$groupsTableName` (
        `id` varchar(50) NOT NULL,
        `name` varchar(255) NOT NULL,
        `expanded` tinyint(1) DEFAULT 1,
        `order` int(11) DEFAULT 0,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $stmt = $conn->prepare($createGroupsTableSQL);
    $stmt->execute();

    // Préparer la requête d'insertion/mise à jour
    $sql = "INSERT INTO `$tableName` 
            (id, nom, exclusion, atteinte, responsabilites, group_id, date_creation, date_modification) 
            VALUES (:id, :nom, :exclusion, :atteinte, :responsabilites, :group_id, :date_creation, :date_modification)
            ON DUPLICATE KEY UPDATE
            nom = VALUES(nom),
            exclusion = VALUES(exclusion),
            atteinte = VALUES(atteinte),
            responsabilites = VALUES(responsabilites),
            group_id = VALUES(group_id),
            date_modification = VALUES(date_modification)";
    
    $stmt = $conn->prepare($sql);

    // Exécuter une transaction pour assurer l'intégrité des données
    $conn->beginTransaction();

    // Effacer d'abord toutes les exigences pour cet utilisateur
    $stmt_delete = $conn->prepare("DELETE FROM `$tableName`");
    $stmt_delete->execute();

    // Insérer ou mettre à jour chaque exigence
    foreach ($data['exigences'] as $exigence) {
        $stmt->bindParam(':id', $exigence['id']);
        $stmt->bindParam(':nom', $exigence['nom']);
        $exclusion = $exigence['exclusion'] ? 1 : 0;
        $stmt->bindParam(':exclusion', $exclusion);
        $stmt->bindParam(':atteinte', $exigence['atteinte']);
        $responsabilites = json_encode($exigence['responsabilites']);
        $stmt->bindParam(':responsabilites', $responsabilites);
        $group_id = $exigence['groupId'] ?? null;
        $stmt->bindParam(':group_id', $group_id);
        
        // Convertir les dates en format MySQL si nécessaire
        if (is_string($exigence['date_creation'])) {
            $date_creation = $exigence['date_creation'];
        } else {
            $date_creation = date('Y-m-d H:i:s');
        }
        $stmt->bindParam(':date_creation', $date_creation);
        
        if (is_string($exigence['date_modification'])) {
            $date_modification = $exigence['date_modification'];
        } else {
            $date_modification = date('Y-m-d H:i:s');
        }
        $stmt->bindParam(':date_modification', $date_modification);
        
        $stmt->execute();
    }

    // Valider la transaction
    $conn->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'Exigences synchronisées avec succès', 
        'count' => count($data['exigences'])
    ]);
    
} catch (Exception $e) {
    // En cas d'erreur, annuler toute modification en cours
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    error_log("Erreur lors de la synchronisation des exigences: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
