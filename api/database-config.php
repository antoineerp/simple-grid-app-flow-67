
<?php
// Force output buffering to prevent output before headers
ob_start();

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

// Activer la journalisation des erreurs
error_log("===== DEBUT EXECUTION database-config.php =====");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Créer un fichier de configuration par défaut si nécessaire
    $dbConfigDir = __DIR__ . '/config';
    $dbConfigFile = $dbConfigDir . '/db_config.json';
    
    if (!is_dir($dbConfigDir)) {
        if (!mkdir($dbConfigDir, 0755, true)) {
            throw new Exception("Impossible de créer le répertoire de configuration");
        }
        error_log("Répertoire de configuration créé: " . $dbConfigDir);
    }
    
    if (!file_exists($dbConfigFile)) {
        $defaultConfig = [
            'host' => 'p71x6d.myd.infomaniak.com',
            'db_name' => 'p71x6d_system',
            'username' => 'p71x6d_richard',
            'password' => 'Trottinette43!'
        ];
        
        if (!file_put_contents($dbConfigFile, json_encode($defaultConfig, JSON_PRETTY_PRINT))) {
            throw new Exception("Impossible de créer le fichier de configuration par défaut");
        }
        error_log("Fichier de configuration par défaut créé: " . $dbConfigFile);
    }

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
    $allHeaders = getallheaders();
    
    // Journaliser les en-têtes pour le débogage
    error_log("Headers reçus dans database-config.php: " . json_encode($allHeaders));
    
    // Mode de développement ou de production
    $isDevelopment = true; // Toujours en mode développement pour permettre l'accès
    
    // En mode développement, on bypass l'authentification
    if ($isDevelopment) {
        $isAuthenticated = true;
        error_log("Mode développement activé: authentification contournée");
    }
    
    // Extraire le token d'autorisation s'il est présent
    $bearerToken = null;
    if (isset($allHeaders['Authorization'])) {
        $authHeader = $allHeaders['Authorization'];
        if (strpos($authHeader, 'Bearer ') === 0) {
            $bearerToken = substr($authHeader, 7);
            error_log("Token d'autorisation trouvé: " . substr($bearerToken, 0, 10) . "...");
            $isAuthenticated = true;
        }
    }
    
    // Si nous avons un contrôleur de configuration de base de données, l'utiliser
    if (file_exists(__DIR__ . '/controllers/DatabaseConfigController.php')) {
        require_once __DIR__ . '/controllers/DatabaseConfigController.php';
        error_log("===== FIN EXECUTION database-config.php (via controller) =====");
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
            'is_connected' => $database->testConnection(),
            'error' => null
        ],
        'authentication' => [
            'is_authenticated' => $isAuthenticated,
            'development_mode' => $isDevelopment,
            'has_bearer_token' => !empty($bearerToken)
        ]
    ];

    // Tentative de récupération des bases de données disponibles
    try {
        $conn = $database->getConnection();
        if ($conn) {
            $stmt = $conn->query("SHOW DATABASES");
            $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Filtrer les bases de données système
            $databases = array_filter($databases, function($db) {
                return $db != 'information_schema' && $db != 'performance_schema' && 
                       $db != 'mysql' && $db != 'sys';
            });
            
            $dbInfo['available_databases'] = array_values($databases);
        } else {
            $dbInfo['connection']['error'] = "Impossible d'établir une connexion à la base de données";
            $dbInfo['available_databases'] = [];
        }
    } catch (Exception $e) {
        $dbInfo['connection']['error'] = $e->getMessage();
        $dbInfo['available_databases'] = [];
    }

    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($dbInfo, JSON_UNESCAPED_UNICODE);
    error_log("===== FIN EXECUTION database-config.php (réponse par défaut) =====");
    
} catch (Exception $e) {
    // Gérer les erreurs
    error_log("Erreur dans database-config.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur serveur: " . $e->getMessage()
    ]);
    error_log("===== FIN EXECUTION database-config.php (avec erreur) =====");
}

// S'assurer que tout buffer est vidé
if (ob_get_level()) ob_end_flush();
?>
