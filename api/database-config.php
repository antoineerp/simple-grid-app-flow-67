
<?php
// Inclure la configuration de base
if (file_exists(__DIR__ . '/config/index.php')) {
    require_once __DIR__ . '/config/index.php';
}

// Configuration des headers
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Définir DIRECT_ACCESS_CHECK pour protéger les fichiers inclus
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

try {
    // Inclure la base de données si elle existe
    if (file_exists(__DIR__ . '/config/database.php')) {
        require_once __DIR__ . '/config/database.php';
    } else {
        throw new Exception("Le fichier de configuration de base de données est introuvable");
    }

    // Vérifier si l'utilisateur est authentifié avec un token valide
    $isAuthenticated = false;
    $userData = null;
    
    // Récupérer les en-têtes de la requête
    $allHeaders = function_exists('getallheaders') ? getallheaders() : [];
    
    // Journaliser les en-têtes pour le débogage
    error_log("Headers reçus dans database-config.php: " . json_encode($allHeaders));
    
    // Mode de développement ou de production
    $isDevelopment = true; // Définir à true pour permettre l'accès temporairement
    
    // En mode développement, on bypass l'authentification
    if ($isDevelopment) {
        $isAuthenticated = true;
        error_log("Mode développement activé: authentification contournée");
    }
    // En production, on vérifie l'authentification
    else if (file_exists(__DIR__ . '/middleware/Auth.php')) {
        require_once __DIR__ . '/middleware/Auth.php';
        
        if (class_exists('Auth')) {
            $auth = new Auth($allHeaders);
            $userData = $auth->isAuth();
            
            if ($userData) {
                $isAuthenticated = true;
                error_log("Utilisateur authentifié: " . json_encode($userData));
            } else {
                error_log("Utilisateur non authentifié");
            }
        }
    }

    // Si nous avons un contrôleur de configuration de base de données, l'utiliser
    if (file_exists(__DIR__ . '/controllers/DatabaseConfigController.php')) {
        require_once __DIR__ . '/controllers/DatabaseConfigController.php';
        exit;
    }

    // En l'absence du contrôleur, créer une réponse par défaut avec la configuration
    $database = new Database();
    $config = $database->getConfig();

    // Masquer le mot de passe pour la sécurité
    $config['password'] = '********';

    // Ajouter des informations supplémentaires sur la connexion
    $dbInfo = [
        'status' => 'success',
        'message' => 'Configuration de la base de données récupérée',
        'config' => $config,
        'connection' => [
            'is_connected' => $database->is_connected ?? false,
            'error' => $database->connection_error ?? null
        ]
    ];

    // Tentative de récupération des bases de données disponibles
    try {
        if (isset($database->is_connected) && $database->is_connected) {
            $conn = $database->getConnection();
            $stmt = $conn->query("SHOW DATABASES");
            $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Filtrer les bases de données système
            $databases = array_filter($databases, function($db) {
                return $db != 'information_schema' && $db != 'performance_schema' && 
                       $db != 'mysql' && $db != 'sys';
            });
            
            $dbInfo['available_databases'] = array_values($databases);
        }
    } catch (Exception $e) {
        $dbInfo['available_databases'] = [];
        $dbInfo['db_list_error'] = $e->getMessage();
    }

    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($dbInfo, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Gérer les erreurs
    error_log("Erreur dans database-config.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur serveur: " . $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}
?>
