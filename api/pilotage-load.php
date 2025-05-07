
<?php
// Force output buffering to prevent output before headers
ob_start();

// Fichier pour charger les données de pilotage depuis le serveur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journalisation
error_log("API pilotage-load.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Vérifier si l'userId est présent
    if (!isset($_GET['userId']) || empty($_GET['userId'])) {
        throw new Exception("Paramètre 'userId' manquant");
    }
    
    $userId = $_GET['userId'];
    error_log("Chargement des données de pilotage pour l'utilisateur: {$userId}");
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Nom de la table spécifique à l'utilisateur
    $tableName = "pilotage_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    
    // Vérifier si la table existe
    $stmt = $pdo->prepare("SHOW TABLES LIKE :tableName");
    $stmt->execute(['tableName' => $tableName]);
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        // Si la table n'existe pas, renvoyer un tableau vide
        echo json_encode([
            'success' => true,
            'documents' => [],
            'message' => 'Aucune donnée trouvée pour cet utilisateur'
        ]);
        exit;
    }
    
    // Récupérer les documents depuis la table
    $stmt = $pdo->query("SELECT * FROM `{$tableName}` ORDER BY id");
    $documents = $stmt->fetchAll();
    
    // Formater les données pour le client
    foreach ($documents as &$document) {
        // Convertir les responsabilités en objet JSON
        if (isset($document['responsabilites']) && $document['responsabilites']) {
            $document['responsabilites'] = json_decode($document['responsabilites'], true);
        } else {
            $document['responsabilites'] = ['r' => [], 'a' => [], 'c' => [], 'i' => []];
        }
        
        // Formater les dates
        if (isset($document['date_creation']) && $document['date_creation']) {
            $document['date_creation'] = date('Y-m-d\TH:i:s', strtotime($document['date_creation']));
        }
        if (isset($document['date_modification']) && $document['date_modification']) {
            $document['date_modification'] = date('Y-m-d\TH:i:s', strtotime($document['date_modification']));
        }
    }
    
    echo json_encode([
        'success' => true,
        'documents' => $documents,
        'count' => count($documents)
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans pilotage-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans pilotage-load.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (ob_get_level()) ob_end_flush();
}
?>
