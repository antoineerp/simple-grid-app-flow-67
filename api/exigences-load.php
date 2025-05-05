
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
error_log("Chargement des exigences pour l'utilisateur: " . $userId);

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Nom de la table des exigences pour cet utilisateur
    $tableName = "user_exigences_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    // Vérifier si la table existe
    $stmt = $conn->prepare("SHOW TABLES LIKE :tableName");
    $stmt->bindParam(':tableName', $tableName);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // La table n'existe pas, renvoyer un tableau vide
        http_response_code(200);
        echo json_encode(['success' => true, 'exigences' => []]);
        exit;
    }

    // Récupérer toutes les exigences
    $sql = "SELECT * FROM `$tableName`";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    
    $exigences = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $exigence = [
            'id' => $row['id'],
            'nom' => $row['nom'],
            'exclusion' => (bool)$row['exclusion'],
            'atteinte' => $row['atteinte'],
            'responsabilites' => json_decode($row['responsabilites'], true),
            'date_creation' => $row['date_creation'],
            'date_modification' => $row['date_modification']
        ];
        
        // Ajouter le groupId s'il existe
        if ($row['group_id']) {
            $exigence['groupId'] = $row['group_id'];
        }
        
        $exigences[] = $exigence;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'exigences' => $exigences,
        'count' => count($exigences)
    ]);
    
} catch (Exception $e) {
    error_log("Erreur lors du chargement des exigences: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
