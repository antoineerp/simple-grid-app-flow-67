<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// CORS - Configuration avancée et sécurisée
$allowed_origins = [
    'https://qualiopi.ch',                   // Domaine principal Infomaniak
    'https://www.qualiopi.ch',               // Avec www
    'https://myd.infomaniak.com',            // Interface Infomaniak
    'http://localhost:8080',                 // Environnement de développement local
    'http://localhost:3000',                 // Alternative pour le développement
    'https://e80de7b3-92db-438f-9423-8243c4b15dfe.lovableproject.com'  // Domaine Lovable
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Vérifier si l'origine est autorisée de manière stricte
header("Vary: Origin");
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Rejeter les origines non autorisées
    header("Access-Control-Allow-Origin: null");
    http_response_code(403);
    error_log("Origine refusée: " . $origin);
    die(json_encode(['error' => 'Origin not allowed']));
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");
header('Content-Type: application/json; charset=utf-8');

// Définir explicitement l'encodage UTF-8
mb_internal_encoding('UTF-8');

// Journaliser les informations sur la requête pour le diagnostic
error_log('=== NOUVELLE REQUÊTE API ===');
error_log('Méthode: ' . $_SERVER['REQUEST_METHOD'] . ' - URI: ' . $_SERVER['REQUEST_URI']);
error_log('Host: ' . $_SERVER['HTTP_HOST']);
error_log('Script name: ' . $_SERVER['SCRIPT_NAME']);

// Fonction pour envoyer une réponse JSON et sortir proprement
function json_response($data, $status = 200) {
    // Nettoyer tout buffer existant
    if (ob_get_level()) {
        ob_clean();
    }
    
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Point d'entrée principal de l'API
    if (file_exists('config/env.php')) {
        require_once 'config/env.php';
    } else {
        error_log('ERREUR: Fichier env.php introuvable');
        json_response(['message' => 'Configuration env.php introuvable', 'status' => 500], 500);
    }

    // Réponse pour les requêtes OPTIONS (CORS preflight)
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        json_response(['status' => 200, 'message' => 'Preflight OK']);
    }

    // URL de la requête
    $request_uri = $_SERVER['REQUEST_URI'];
    $request_uri = strtok($request_uri, '?');

    // Nettoyage du chemin pour les installations dans sous-dossiers (spécifique à Infomaniak)
    if (strpos($request_uri, '/sites/qualiopi.ch/api/') !== false) {
        $request_uri = str_replace('/sites/qualiopi.ch/api/', '/api/', $request_uri);
        error_log('URI nettoyée (sous-dossier Infomaniak): ' . $request_uri);
    }

    $url_segments = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));

    // Journalisation des segments d'URL
    error_log('URL complète: ' . $request_uri);
    error_log('URL segments: ' . print_r($url_segments, true));

    // Vérifier les noms de fichiers spécifiques directement demandés
    $filename = basename($request_uri);
    if (in_array($filename, ['auth.php', 'login-test.php', 'check-users.php'])) {
        error_log('Accès direct au fichier détecté: ' . $filename);
        $file_path = __DIR__ . '/' . $filename;
        
        if (file_exists($file_path)) {
            error_log('Fichier trouvé, inclusion directe: ' . $file_path);
            
            // Vidanger le buffer de sortie actuel pour éviter les interférences
            if (ob_get_level()) {
                ob_clean();
            }
            
            include_once $file_path;
            exit;
        } else {
            error_log('ERREUR: Fichier non trouvé: ' . $file_path);
            json_response(['message' => 'Fichier non trouvé: ' . $filename, 'status' => 404], 404);
        }
    }

    // Vérifier si la requête est pour auth.php directement
    if (strpos($request_uri, 'auth.php') !== false || strpos($request_uri, 'auth') !== false) {
        error_log('Requête d\'authentification détectée');
        
        if (file_exists(__DIR__ . '/controllers/AuthController.php')) {
            // Vidanger le buffer de sortie actuel
            if (ob_get_level()) {
                ob_clean();
            }
            
            require_once 'controllers/AuthController.php';
            exit;
        } else {
            error_log('ERREUR: Contrôleur d\'authentification introuvable');
            json_response(['message' => 'Contrôleur d\'authentification introuvable', 'status' => 500], 500);
        }
    }

    // Vérifier si la requête est pour login directement
    if (strpos($request_uri, 'login') !== false) {
        error_log('Requête de login détectée - redirection vers AuthController');
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Traiter la requête POST comme une tentative de connexion
            if (file_exists(__DIR__ . '/controllers/AuthController.php')) {
                // Vidanger le buffer de sortie actuel
                if (ob_get_level()) {
                    ob_clean();
                }
                
                require_once 'controllers/AuthController.php';
                exit;
            } else {
                error_log('ERREUR: Contrôleur d\'authentification introuvable');
                json_response(['message' => 'Contrôleur d\'authentification introuvable', 'status' => 500], 500);
            }
        }
    }

    // Vérifier si le segment "auth" est présent
    foreach ($url_segments as $segment) {
        if ($segment === 'auth' || $segment === 'auth.php' || $segment === 'login') {
            error_log('Requête d\'authentification détectée via segment: ' . $segment);
            
            if (file_exists(__DIR__ . '/controllers/AuthController.php')) {
                // Vidanger le buffer de sortie actuel
                if (ob_get_level()) {
                    ob_clean();
                }
                
                require_once 'controllers/AuthController.php';
                exit;
            } else {
                error_log('ERREUR: Contrôleur d\'authentification introuvable');
                json_response(['message' => 'Contrôleur d\'authentification introuvable', 'status' => 500], 500);
            }
        }
    }

    // Trouver le point d'entrée de l'API
    $api_index = array_search('api', $url_segments);
    if ($api_index !== false) {
        $segments = array_slice($url_segments, $api_index + 1);
        
        error_log('API segments: ' . print_r($segments, true));
        
        if (count($segments) > 0) {
            $endpoint = $segments[0];
            
            try {
                switch ($endpoint) {
                    case 'login':
                    case 'auth':
                    case 'auth.php':
                        if (file_exists(__DIR__ . '/controllers/AuthController.php')) {
                            // Vidanger le buffer de sortie actuel
                            if (ob_get_level()) {
                                ob_clean();
                            }
                            
                            require_once 'controllers/AuthController.php';
                        } else {
                            error_log('ERREUR: Contrôleur d\'authentification introuvable');
                            json_response(['message' => 'Contrôleur d\'authentification introuvable', 'status' => 500], 500);
                        }
                        break;
                        
                    case 'utilisateurs':
                        if (file_exists(__DIR__ . '/controllers/UserController.php')) {
                            require_once 'controllers/UserController.php';
                        } else {
                            error_log('ERREUR: Contrôleur utilisateurs introuvable');
                            json_response(['message' => 'Contrôleur utilisateurs introuvable', 'status' => 500], 500);
                        }
                        break;
                        
                    case 'config':
                        if (file_exists(__DIR__ . '/controllers/ConfigController.php')) {
                            require_once 'controllers/ConfigController.php';
                        } else {
                            error_log('ERREUR: Contrôleur config introuvable');
                            json_response(['message' => 'Contrôleur config introuvable', 'status' => 500], 500);
                        }
                        break;
                        
                    default:
                        json_response(['message' => 'Endpoint non trouvé: ' . $endpoint, 'status' => 404], 404);
                        break;
                }
            } catch (Exception $e) {
                error_log("Erreur API: " . $e->getMessage());
                json_response([
                    'message' => 'Erreur serveur', 
                    'error' => $e->getMessage(),
                    'status' => 500
                ], 500);
            }
        } else {
            // Point d'entrée API - test de disponibilité
            json_response([
                'message' => 'API PHP disponible',
                'status' => 200,
                'environment' => 'production',
                'server_info' => [
                    'host' => $_SERVER['HTTP_HOST'],
                    'uri' => $_SERVER['REQUEST_URI'],
                    'script' => $_SERVER['SCRIPT_NAME']
                ]
            ]);
        }
    } else {
        json_response(['message' => 'API non trouvée', 'status' => 404], 404);
    }
} catch (Exception $e) {
    error_log("Erreur critique dans index.php: " . $e->getMessage());
    error_log("Trace: " . $e->getTraceAsString());
    
    // Nettoyer tout buffer existant
    if (ob_get_level()) {
        ob_clean();
    }
    
    json_response([
        'message' => 'Erreur serveur non gérée', 
        'error' => $e->getMessage(),
        'status' => 500
    ], 500);
}

// Assurer que toute sortie est envoyée et terminer proprement
if (ob_get_level()) {
    ob_end_flush();
}
