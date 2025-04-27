
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration stricte des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); // Ne pas afficher les erreurs dans la réponse
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// Headers CORS et Content-Type explicites et stricts
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation détaillée des requêtes
error_log("API Request - Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'UNDEFINED'));
error_log("API Request - URI: " . ($_SERVER['REQUEST_URI'] ?? 'UNDEFINED'));
error_log("API Request - Path: " . parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH));
error_log("API Request - Query: " . parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY));

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight request accepted']);
    exit;
}

// Fonction pour nettoyer les données UTF-8
function cleanUTF8($input) {
    if (is_string($input)) {
        return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
    } elseif (is_array($input)) {
        foreach ($input as $key => $value) {
            $input[$key] = cleanUTF8($value);
        }
    }
    return $input;
}

// Fonction de routage pour l'API
function routeApi() {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    error_log("Routage API - URI traitée: {$uri}");
    
    // Extraire le chemin de l'API sans le préfixe /api
    $path = preg_replace('/^\/api\/?/', '', $uri);
    error_log("Routage API - Chemin traité: {$path}");
    
    // Supprimer les slashs au début et à la fin pour une normalisation uniforme
    $path = trim($path, '/');
    
    // Traitement spécial pour index.php, le considérer comme la racine
    if ($path === 'index.php') {
        $path = '';
        error_log("Routage API - Chemin normalisé vers la racine de l'API");
    }
    
    // Router vers les différents endpoints
    switch ($path) {
        case '':
            // Point d'entrée principal de l'API
            return diagnoseRequest();
            
        case 'diagnose':
        case 'diagnostic-complet':
            // Diagnostic complet du serveur
            require_once __DIR__ . '/diagnose.php';
            exit;
            
        case 'diagnostic':
            // Diagnostic de l'API
            require_once __DIR__ . '/diagnostic.php';
            exit;
        
        case 'config':
        case 'config.php':
            // Configuration de l'API
            require_once __DIR__ . '/config.php';
            exit;
            
        case 'config-test':
        case 'config-test.php':
            // Configuration de test de l'API
            require_once __DIR__ . '/config-test.php';
            exit;
        
        case 'database-diagnostic':
            // Rediriger vers le diagnostic de base de données (fichier principal)
            require_once __DIR__ . '/database-diagnostic.php';
            exit;
            
        case 'db-diagnostic':
        case 'db-diagnostic.php':
            // Rediriger vers notre fichier db-diagnostic optimisé
            require_once __DIR__ . '/db-diagnostic.php';
            exit;
            
        case 'database-diagnostics':
            // Rediriger vers le diagnostic alternatif si le fichier existe
            if (file_exists(__DIR__ . '/database-diagnostics.php')) {
                require_once __DIR__ . '/database-diagnostics.php';
            } else {
                // Utiliser database-diagnostic.php comme alternative
                require_once __DIR__ . '/database-diagnostic.php';
            }
            exit;
            
        case 'db-info':
        case 'db-info.php':
            // Nouveau point d'entrée pour les informations de base de données
            require_once __DIR__ . '/db-info.php';
            exit;
        
        case 'database-config':
        case 'database-config.php':
            // Point d'entrée pour la configuration de la base de données
            require_once __DIR__ . '/database-config.php';
            exit;
            
        case 'users':
        case 'utilisateurs': // Ajouter un alias pour la compatibilité avec d'anciennes URLs
            // Rediriger vers le contrôleur d'utilisateurs
            require_once __DIR__ . '/users.php';
            exit;
            
        case 'database-test':
            // Rediriger vers le test de base de données
            require_once __DIR__ . '/database-test.php';
            exit;
            
        case 'db-connection-test':
            // Rediriger vers le test de connexion
            require_once __DIR__ . '/db-connection-test.php';
            exit;
            
        case 'check-users':
            // Rediriger vers la vérification des utilisateurs
            require_once __DIR__ . '/check-users.php';
            exit;
            
        case 'user-diagnostic':
            // Rediriger vers le diagnostic utilisateur
            require_once __DIR__ . '/user-diagnostic.php';
            exit;
        
        case 'check-permissions':
            // Vérification des permissions des fichiers
            require_once __DIR__ . '/check-permissions.php';
            exit;
            
        case 'advanced-diagnostic':
        case 'diagnostic-avance': // Alias sans accent
            // Diagnostic avancé du système
            require_once __DIR__ . '/advanced-diagnostic.php';
            exit;
            
        // Routes pour la synchronisation des données
        case 'documents-load':
        case 'documents-load.php':
            // Chargement des documents
            require_once __DIR__ . '/documents-load.php';
            exit;
            
        case 'documents-sync':
        case 'documents-sync.php':
            // Synchronisation des documents
            require_once __DIR__ . '/documents-sync.php';
            exit;
            
        case 'exigences-load':
        case 'exigences-load.php':
            // Chargement des exigences
            require_once __DIR__ . '/exigences-load.php';
            exit;
            
        case 'exigences-sync':
        case 'exigences-sync.php':
            // Synchronisation des exigences
            require_once __DIR__ . '/exigences-sync.php';
            exit;
            
        case 'membres-load':
        case 'membres-load.php':
            // Chargement des membres
            require_once __DIR__ . '/membres-load.php';
            exit;
            
        case 'membres-sync':
        case 'membres-sync.php':
            // Synchronisation des membres
            require_once __DIR__ . '/membres-sync.php';
            exit;
            
        case 'bibliotheque-load':
        case 'bibliotheque-load.php':
            // Chargement de la bibliothèque
            require_once __DIR__ . '/bibliotheque-load.php';
            exit;
            
        case 'bibliotheque-sync':
        case 'bibliotheque-sync.php':
            // Synchronisation de la bibliothèque
            require_once __DIR__ . '/bibliotheque-sync.php';
            exit;
            
        default:
            // Si aucun contrôleur n'est trouvé, renvoyer une erreur 404
            http_response_code(404);
            return [
                'status' => 'error',
                'message' => "Point de terminaison non trouvé: {$path}",
                'request_uri' => $_SERVER['REQUEST_URI'],
                'parsed_path' => $path
            ];
    }
}

// Fonction de diagnostic améliorée
function diagnoseRequest() {
    return [
        'status' => 'success',
        'message' => 'Point de terminaison API principal',
        'endpoints' => [
            '/api' => 'Ce point d\'entrée - informations générales',
            '/api/diagnostic' => 'Diagnostic de l\'API et du serveur',
            '/api/diagnose' => 'Diagnostic complet du serveur',
            '/api/database-diagnostic' => 'Diagnostic complet de la base de données',
            '/api/db-diagnostic' => 'Diagnostic de base de données optimisé',
            '/api/db-info' => 'Informations simples de la base de données',
            '/api/database-config' => 'Configuration de la base de données',
            '/api/users' => 'Gestion des utilisateurs',
            '/api/database-test' => 'Test de connexion à la base de données',
            '/api/check-users' => 'Vérification des utilisateurs',
            '/api/user-diagnostic' => 'Diagnostic des utilisateurs',
            // Nouvelles routes ajoutées à la documentation
            '/api/documents-load' => 'Chargement des documents',
            '/api/documents-sync' => 'Synchronisation des documents',
            '/api/exigences-load' => 'Chargement des exigences',
            '/api/exigences-sync' => 'Synchronisation des exigences',
            '/api/membres-load' => 'Chargement des membres',
            '/api/membres-sync' => 'Synchronisation des membres',
            '/api/bibliotheque-load' => 'Chargement de la bibliothèque',
            '/api/bibliotheque-sync' => 'Synchronisation de la bibliothèque'
        ],
        'server_details' => [
            'php_version' => phpversion(),
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'Non défini',
            'uri' => $_SERVER['REQUEST_URI'] ?? 'Non défini',
            'parsed_uri' => parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH),
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ];
}

try {
    // Assurer que nous n'avons pas de sortie avant les headers
    if (ob_get_level()) ob_clean();

    // Router la requête vers le bon contrôleur
    $response = routeApi();
    
    // Si le routage a renvoyé une réponse (et pas quitté via require), l'envoyer
    if ($response) {
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    error_log("Erreur API : " . $e->getMessage());
    
    // Nettoyer toute sortie existante
    if (ob_get_length()) ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur interne du serveur',
        'error_details' => $e->getMessage()
    ]);
} finally {
    // S'assurer que tout output est envoyé
    if (ob_get_length()) ob_end_flush();
}
?>
