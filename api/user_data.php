
<?php
// Définir les en-têtes pour permettre CORS et spécifier le type de contenu
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Vérifier si la méthode de requête est GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    // Réponse pour les requêtes OPTIONS (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
    
    // Pour les autres méthodes, renvoyer une erreur 405 Method Not Allowed
    http_response_code(405);
    echo json_encode(["message" => "Méthode non autorisée"]);
    exit;
}

// Vérifier si l'ID est fourni
if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["message" => "ID utilisateur manquant"]);
    exit;
}

// Inclure les fichiers nécessaires
if (file_exists(dirname(__FILE__) . '/config/database.php')) {
    require_once dirname(__FILE__) . '/config/database.php';
    require_once dirname(__FILE__) . '/utils/ResponseHandler.php';
} else {
    http_response_code(500);
    echo json_encode(["message" => "Erreur de configuration du serveur"]);
    exit;
}

try {
    // Établir la connexion à la base de données
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données");
    }

    // Récupérer l'ID de l'utilisateur
    $user_id = filter_var($_GET['id'], FILTER_SANITIZE_NUMBER_INT);
    
    // Préparer la requête SQL pour récupérer les données utilisateur
    // NOTE: Seulement des données non sensibles sont renvoyées
    $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation 
              FROM utilisateurs 
              WHERE id = :id 
              LIMIT 1";
              
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $user_id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        // Récupérer les données utilisateur
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Répondre avec les données utilisateur
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "data" => $user
        ]);
    } else {
        // Aucun utilisateur trouvé
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Utilisateur non trouvé"
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur serveur: " . $e->getMessage()
    ]);
}
?>
