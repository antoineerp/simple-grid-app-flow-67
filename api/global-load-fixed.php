
<?php
// Inclure la configuration de base
require_once __DIR__ . '/config/index.php';

// Configuration des headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Vérifier que la méthode est GET
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
        exit;
    }
    
    // Récupérer l'identifiant de l'utilisateur depuis les paramètres GET
    $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "L'identifiant utilisateur est requis"]);
        exit;
    }
    
    // Chargement du fichier de configuration de la BD à partir du fichier JSON
    $dbConfigPath = __DIR__ . '/config/db_config.json';
    if (!file_exists($dbConfigPath)) {
        $dbConfigPath = __DIR__ . '/config/db_config.example.json';
        if (!file_exists($dbConfigPath)) {
            throw new Exception("Fichier de configuration de base de données introuvable");
        }
    }
    
    $dbConfig = json_decode(file_get_contents($dbConfigPath), true);
    if (!$dbConfig) {
        throw new Exception("Erreur de lecture de la configuration de base de données");
    }
    
    // Connexion à la base de données
    $host = $dbConfig['host'];
    $dbname = $dbConfig['db_name'];
    $username = $dbConfig['username'];
    $password = $dbConfig['password'];
    
    // Test de connexion seulement si tous les paramètres sont présents
    if (empty($host) || empty($dbname) || empty($username)) {
        // Fournir des données factices pour les tests sans base de données
        $result = [
            "success" => true,
            "data" => [
                "pilotageDocuments" => [],
                "membres" => [],
                "documents" => [],
                "exigences" => [],
                "bibliotheque" => [
                    "documents" => [],
                    "groups" => []
                ]
            ],
            "message" => "Mode hors ligne - données fictives"
        ];
    } else {
        // Connexion à la base de données réelle
        try {
            $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            
            // Résultat final
            $result = [
                "success" => true,
                "data" => []
            ];
            
            // Charger les documents de pilotage
            $tableName = "pilotage_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            $result["data"]["pilotageDocuments"] = loadTableData($pdo, $tableName);
            
            // Charger les membres
            $tableName = "membres_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            $result["data"]["membres"] = loadTableData($pdo, $tableName);
            
            // Charger les documents
            $tableName = "documents_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            $result["data"]["documents"] = loadTableData($pdo, $tableName);
            
            // Charger les exigences
            $tableName = "exigences_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            $result["data"]["exigences"] = loadTableData($pdo, $tableName);
            
            // Charger la bibliothèque
            $docsTableName = "biblio_docs_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            $groupsTableName = "biblio_groups_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            
            $result["data"]["bibliotheque"] = [
                "documents" => loadTableData($pdo, $docsTableName),
                "groups" => loadTableData($pdo, $groupsTableName)
            ];
        } catch (PDOException $e) {
            // En cas d'erreur de base de données, fournir des données factices mais avec une notification d'erreur
            $result = [
                "success" => false,
                "data" => [
                    "pilotageDocuments" => [],
                    "membres" => [],
                    "documents" => [],
                    "exigences" => [],
                    "bibliotheque" => [
                        "documents" => [],
                        "groups" => []
                    ]
                ],
                "error" => "Erreur de connexion à la base de données: " . $e->getMessage()
            ];
        }
    }
    
    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($result);
    
} catch (Exception $e) {
    // Gérer les erreurs
    error_log("Erreur dans global-load.php: " . $e->getMessage());
    http_response_code(500);
    
    // Réponse JSON avec informations d'erreur
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur serveur: " . $e->getMessage(),
        "data" => [
            "pilotageDocuments" => [],
            "membres" => [],
            "documents" => [],
            "exigences" => [],
            "bibliotheque" => [
                "documents" => [],
                "groups" => []
            ]
        ]
    ]);
}

/**
 * Fonction pour charger les données d'une table
 */
function loadTableData($pdo, $tableName) {
    try {
        // Vérifier si la table existe
        $stmt = $pdo->prepare("SHOW TABLES LIKE :tableName");
        $stmt->execute(['tableName' => $tableName]);
        $tableExists = $stmt->rowCount() > 0;
        
        if (!$tableExists) {
            return [];
        }
        
        // Récupérer les données
        $stmt = $pdo->query("SELECT * FROM `{$tableName}`");
        $items = $stmt->fetchAll();
        
        // Traiter les données spéciales
        foreach ($items as &$item) {
            if (isset($item['responsabilites']) && $item['responsabilites']) {
                $item['responsabilites'] = json_decode($item['responsabilites'], true);
            }
            
            if (isset($item['date_creation']) && $item['date_creation']) {
                $item['date_creation'] = date('Y-m-d\TH:i:s', strtotime($item['date_creation']));
            }
            
            if (isset($item['date_modification']) && $item['date_modification']) {
                $item['date_modification'] = date('Y-m-d\TH:i:s', strtotime($item['date_modification']));
            }
        }
        
        return $items;
    } catch (Exception $e) {
        error_log("Erreur lors du chargement de la table {$tableName}: " . $e->getMessage());
        return [];
    }
}
?>
