
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
if (!$data || !isset($data['userId']) || !isset($data['membres'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données invalides']);
    exit;
}

// Journaliser la requête
error_log("Synchronisation des membres pour l'utilisateur: " . $data['userId']);
error_log("Nombre de membres à synchroniser: " . count($data['membres']));

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Créer la table des membres si elle n'existe pas
    $userId = $data['userId'];
    $tableName = "user_membres_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    $createTableSQL = "CREATE TABLE IF NOT EXISTS `$tableName` (
        `id` varchar(50) NOT NULL,
        `nom` varchar(255) NOT NULL,
        `prenom` varchar(255) NOT NULL,
        `fonction` varchar(255) DEFAULT NULL,
        `initiales` varchar(10) DEFAULT NULL,
        `mot_de_passe` varchar(255) DEFAULT NULL,
        `date_creation` datetime DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $stmt = $conn->prepare($createTableSQL);
    $stmt->execute();

    // Exécuter une transaction pour assurer l'intégrité des données
    $conn->beginTransaction();

    // Effacer d'abord tous les membres pour cet utilisateur
    $stmt_delete = $conn->prepare("DELETE FROM `$tableName`");
    $stmt_delete->execute();

    // Préparer la requête d'insertion/mise à jour
    $sql = "INSERT INTO `$tableName` 
            (id, nom, prenom, fonction, initiales, mot_de_passe, date_creation) 
            VALUES (:id, :nom, :prenom, :fonction, :initiales, :mot_de_passe, :date_creation)";
    
    $stmt = $conn->prepare($sql);

    // Insérer ou mettre à jour chaque membre
    foreach ($data['membres'] as $membre) {
        $stmt->bindParam(':id', $membre['id']);
        $stmt->bindParam(':nom', $membre['nom']);
        $stmt->bindParam(':prenom', $membre['prenom']);
        $fonction = $membre['fonction'] ?? null;
        $stmt->bindParam(':fonction', $fonction);
        $initiales = $membre['initiales'] ?? null;
        $stmt->bindParam(':initiales', $initiales);
        $mot_de_passe = $membre['mot_de_passe'] ?? null;
        $stmt->bindParam(':mot_de_passe', $mot_de_passe);
        
        // Convertir la date en format MySQL si nécessaire
        if (isset($membre['date_creation']) && is_string($membre['date_creation'])) {
            $date_creation = $membre['date_creation'];
        } else {
            $date_creation = date('Y-m-d H:i:s');
        }
        $stmt->bindParam(':date_creation', $date_creation);
        
        $stmt->execute();
    }

    // Valider la transaction
    $conn->commit();

    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'message' => 'Membres synchronisés avec succès', 
        'count' => count($data['membres'])
    ]);
    
} catch (Exception $e) {
    // En cas d'erreur, annuler toute modification en cours
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    error_log("Erreur lors de la synchronisation des membres: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
