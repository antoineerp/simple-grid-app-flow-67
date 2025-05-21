
<?php
// Point d'entrée API unifié - Test fonctionnel et récupération des utilisateurs
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== EXÉCUTION DE test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Récupérer le type de requête depuis les paramètres GET
$action = isset($_GET['action']) ? $_GET['action'] : 'status';

try {
    // Configuration de la base de données (celle qui fonctionne)
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_richard";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Exécuter l'action demandée
    switch ($action) {
        case 'users':
            // Récupérer les utilisateurs
            $query = "SELECT id, nom, prenom, email, role, identifiant_technique, date_creation FROM utilisateurs";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Liste des utilisateurs récupérée avec succès',
                'records' => $users,
                'count' => count($users)
            ]);
            break;
            
        case 'tables':
            // Récupérer les tables d'un utilisateur spécifique
            $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
            
            if (!$userId) {
                throw new Exception("L'identifiant utilisateur est requis pour lister les tables");
            }
            
            // Lister toutes les tables
            $stmt = $pdo->query("SHOW TABLES");
            $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Filtrer les tables appartenant à l'utilisateur spécifié
            $userTables = [];
            foreach ($allTables as $table) {
                if (strpos($table, $userId) !== false) {
                    $userTables[] = $table;
                }
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => "Tables pour l'utilisateur {$userId}",
                'user_id' => $userId,
                'tables' => $userTables,
                'count' => count($userTables)
            ]);
            break;
            
        case 'status':
        default:
            // Simple test de connexion
            $version = $pdo->query('SELECT VERSION()')->fetchColumn();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'API test endpoint fonctionnel',
                'connection' => 'Connexion PDO réussie à la base richard',
                'db_version' => $version,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
    }
} catch (PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de connexion à la base de données',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Erreur: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

error_log("=== FIN DE test.php ===");
?>
