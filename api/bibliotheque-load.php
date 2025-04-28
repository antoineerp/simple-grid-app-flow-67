
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-load.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Configuration de la base de données (sans dépendre de env.php)
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Vérifier si l'userId est présent
    if (!isset($_GET['userId'])) {
        throw new Exception("ID utilisateur manquant");
    }
    
    $userId = $_GET['userId'];
    error_log("UserId reçu: " . $userId);
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Nom de la table spécifique à l'utilisateur
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tableName = "bibliotheque_" . $safeUserId;
    error_log("Table à consulter: {$tableName}");
    
    // Vérifier si la table existe
    $tableExistsQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute([$dbname, $tableName]);
    $tableExists = (int)$stmt->fetchColumn() > 0;
    
    $ressources = [];
    
    if ($tableExists) {
        // Récupérer les ressources
        $query = "SELECT * FROM `{$tableName}`";
        $stmt = $pdo->query($query);
        $ressources = $stmt->fetchAll();
        
        // Formater les dates pour le client
        foreach ($ressources as &$ressource) {
            if (isset($ressource['date_creation']) && $ressource['date_creation']) {
                $ressource['date_creation'] = date('Y-m-d\TH:i:s', strtotime($ressource['date_creation']));
            }
            if (isset($ressource['date_modification']) && $ressource['date_modification']) {
                $ressource['date_modification'] = date('Y-m-d\TH:i:s', strtotime($ressource['date_modification']));
            }
            
            // Convertir les tags JSON en tableau
            if (isset($ressource['tags']) && $ressource['tags']) {
                try {
                    $ressource['tags'] = json_decode($ressource['tags'], true);
                } catch (Exception $e) {
                    $ressource['tags'] = [];
                }
            } else {
                $ressource['tags'] = [];
            }
        }
    } else {
        // Créer la table si elle n'existe pas
        $createTableQuery = "CREATE TABLE `{$tableName}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `titre` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `url` VARCHAR(255) NULL,
            `type` VARCHAR(50) NULL,
            `tags` TEXT NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        $pdo->exec($createTableQuery);
        error_log("Table {$tableName} créée");
    }
    
    error_log("Ressources récupérées: " . count($ressources));
    
    // Renvoyer les ressources au format JSON
    echo json_encode([
        'success' => true,
        'ressources' => $ressources,
        'count' => count($ressources)
    ]);
    
} catch (PDOException $e) {
    error_log("PDOException dans bibliotheque-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans bibliotheque-load.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE bibliotheque-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
