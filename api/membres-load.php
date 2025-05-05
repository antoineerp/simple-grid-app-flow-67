
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
error_log("Chargement des membres pour l'utilisateur: " . $userId);

try {
    // Inclure la configuration de la base de données
    require_once 'config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Vérifier si la connexion est établie
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Nom de la table des membres pour cet utilisateur
    $tableName = "user_membres_" . preg_replace('/[^a-z0-9_]/i', '_', $userId);
    
    // Vérifier si la table existe
    $stmt = $conn->prepare("SHOW TABLES LIKE :tableName");
    $stmt->bindParam(':tableName', $tableName);
    $stmt->execute();
    
    $membres = [];
    
    if ($stmt->rowCount() > 0) {
        // Récupérer tous les membres
        $sql = "SELECT * FROM `$tableName`";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $membre = [
                'id' => $row['id'],
                'nom' => $row['nom'],
                'prenom' => $row['prenom'],
                'fonction' => $row['fonction'],
                'initiales' => $row['initiales'],
                'mot_de_passe' => $row['mot_de_passe'],
                'date_creation' => $row['date_creation']
            ];
            
            $membres[] = $membre;
        }
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'membres' => $membres,
        'count' => count($membres)
    ]);
    
} catch (Exception $e) {
    error_log("Erreur lors du chargement des membres: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>
