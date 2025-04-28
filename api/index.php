
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

// Fonction simple pour gérer les erreurs (ne dépend pas de HttpErrorHandler)
function handleSimpleError($code, $message, $details = []) {
    http_response_code($code);
    echo json_encode([
        'status' => 'error', 
        'code' => $code, 
        'message' => $message,
        'details' => $details
    ]);
    exit;
}

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
    
    // Router vers les différents endpoints
    switch ($path) {
        case '':
            // Point d'entrée principal de l'API
            return diagnoseRequest();
            
        case 'diagnose':
        case 'diagnostic-complet':
            // Diagnostic complet du serveur
            if (file_exists(__DIR__ . '/diagnose.php')) {
                require_once __DIR__ . '/diagnose.php';
            } else {
                handleSimpleError(404, "Fichier de diagnostic introuvable", ['path' => $path]);
            }
            exit;
            
        case 'diagnostic':
            // Diagnostic de l'API
            if (file_exists(__DIR__ . '/diagnostic.php')) {
                require_once __DIR__ . '/diagnostic.php';
            } else {
                handleSimpleError(404, "Fichier de diagnostic introuvable", ['path' => $path]);
            }
            exit;
        
        case 'config':
        case 'config.php':
            // Configuration de l'API
            if (file_exists(__DIR__ . '/config.php')) {
                require_once __DIR__ . '/config.php';
            } else {
                handleSimpleError(404, "Fichier de configuration introuvable", ['path' => $path]);
            }
            exit;
            
        case 'config-test':
        case 'config-test.php':
            // Configuration de test de l'API
            if (file_exists(__DIR__ . '/config-test.php')) {
                require_once __DIR__ . '/config-test.php';
            } else {
                handleSimpleError(404, "Fichier de test de configuration introuvable", ['path' => $path]);
            }
            exit;
        
        case 'database-diagnostic':
            // Rediriger vers le diagnostic de base de données (fichier principal)
            if (file_exists(__DIR__ . '/database-diagnostic.php')) {
                require_once __DIR__ . '/database-diagnostic.php';
            } else {
                handleSimpleError(404, "Fichier de diagnostic de base de données introuvable", ['path' => $path]);
            }
            exit;
            
        case 'db-diagnostic':
        case 'db-diagnostic.php':
            // Rediriger vers notre fichier db-diagnostic optimisé
            if (file_exists(__DIR__ . '/db-diagnostic.php')) {
                require_once __DIR__ . '/db-diagnostic.php';
            } else {
                handleSimpleError(404, "Fichier de diagnostic de base de données optimisé introuvable", ['path' => $path]);
            }
            exit;
            
        case 'database-diagnostics':
            // Rediriger vers le diagnostic alternatif si le fichier existe
            if (file_exists(__DIR__ . '/database-diagnostics.php')) {
                require_once __DIR__ . '/database-diagnostics.php';
            } elseif (file_exists(__DIR__ . '/database-diagnostic.php')) {
                // Utiliser database-diagnostic.php comme alternative
                require_once __DIR__ . '/database-diagnostic.php';
            } else {
                handleSimpleError(404, "Fichiers de diagnostic de base de données introuvables", ['path' => $path]);
            }
            exit;
            
        case 'db-info':
        case 'db-info.php':
            // Nouveau point d'entrée pour les informations de base de données
            if (file_exists(__DIR__ . '/db-info.php')) {
                require_once __DIR__ . '/db-info.php';
            } else {
                handleSimpleError(404, "Fichier d'informations de base de données introuvable", ['path' => $path]);
            }
            exit;
        
        case 'database-config':
        case 'database-config.php':
            // Point d'entrée pour la configuration de la base de données
            if (file_exists(__DIR__ . '/database-config.php')) {
                require_once __DIR__ . '/database-config.php';
            } else {
                handleSimpleError(404, "Fichier de configuration de base de données introuvable", ['path' => $path]);
            }
            exit;
            
        case 'users':
        case 'utilisateurs': // Ajouter un alias pour la compatibilité avec d'anciennes URLs
            // Rediriger vers le contrôleur d'utilisateurs
            if (file_exists(__DIR__ . '/users.php')) {
                require_once __DIR__ . '/users.php';
            } else {
                handleSimpleError(404, "Contrôleur d'utilisateurs introuvable", ['path' => $path]);
            }
            exit;
            
        case 'database-test':
            // Rediriger vers le test de base de données
            if (file_exists(__DIR__ . '/database-test.php')) {
                require_once __DIR__ . '/database-test.php';
            } else {
                handleSimpleError(404, "Fichier de test de base de données introuvable", ['path' => $path]);
            }
            exit;
            
        case 'db-connection-test':
            // Rediriger vers le test de connexion
            if (file_exists(__DIR__ . '/db-connection-test.php')) {
                require_once __DIR__ . '/db-connection-test.php';
            } else {
                handleSimpleError(404, "Fichier de test de connexion introuvable", ['path' => $path]);
            }
            exit;
            
        case 'check-users':
            // Rediriger vers la vérification des utilisateurs
            if (file_exists(__DIR__ . '/check-users.php')) {
                require_once __DIR__ . '/check-users.php';
            } else {
                handleSimpleError(404, "Fichier de vérification des utilisateurs introuvable", ['path' => $path]);
            }
            exit;
            
        case 'user-diagnostic':
        case 'user-diagnostic.php':
            // Rediriger vers le diagnostic utilisateur
            if (file_exists(__DIR__ . '/user-diagnostic.php')) {
                require_once __DIR__ . '/user-diagnostic.php';
            } else {
                handleSimpleError(404, "Fichier de diagnostic utilisateur introuvable", ['path' => $path]);
            }
            exit;
            
        case 'error-log':
        case 'error-log.php':
            // Point d'entrée pour le diagnostic des erreurs
            if (file_exists(__DIR__ . '/error-log.php')) {
                require_once __DIR__ . '/error-log.php';
            } else {
                handleSimpleError(404, "Fichier de diagnostic des erreurs introuvable", ['path' => $path]);
            }
            exit;
            
        case 'documents-load':
        case 'documents-load.php':
            // Chargement des documents
            if (file_exists(__DIR__ . '/documents-load.php')) {
                require_once __DIR__ . '/documents-load.php';
            } else {
                handleSimpleError(404, "Fichier de chargement des documents introuvable", ['path' => $path]);
            }
            exit;
            
        case 'documents-sync':
        case 'documents-sync.php':
            // Synchronisation des documents
            if (file_exists(__DIR__ . '/documents-sync.php')) {
                require_once __DIR__ . '/documents-sync.php';
            } else {
                handleSimpleError(404, "Fichier de synchronisation des documents introuvable", ['path' => $path]);
            }
            exit;
            
        case 'exigences-load':
        case 'exigences-load.php':
            // Chargement des exigences
            if (file_exists(__DIR__ . '/exigences-load.php')) {
                require_once __DIR__ . '/exigences-load.php';
            } else {
                handleSimpleError(404, "Fichier de chargement des exigences introuvable", ['path' => $path]);
            }
            exit;
            
        case 'exigences-sync':
        case 'exigences-sync.php':
            // Synchronisation des exigences
            if (file_exists(__DIR__ . '/exigences-sync.php')) {
                require_once __DIR__ . '/exigences-sync.php';
            } else {
                handleSimpleError(404, "Fichier de synchronisation des exigences introuvable", ['path' => $path]);
            }
            exit;
            
        case 'membres-load':
        case 'membres-load.php':
            // Chargement des membres
            if (file_exists(__DIR__ . '/membres-load.php')) {
                require_once __DIR__ . '/membres-load.php';
            } else {
                handleSimpleError(404, "Fichier de chargement des membres introuvable", ['path' => $path]);
            }
            exit;
            
        case 'membres-sync':
        case 'membres-sync.php':
            // Synchronisation des membres
            if (file_exists(__DIR__ . '/membres-sync.php')) {
                require_once __DIR__ . '/membres-sync.php';
            } else {
                handleSimpleError(404, "Fichier de synchronisation des membres introuvable", ['path' => $path]);
            }
            exit;
            
        case 'bibliotheque-load':
        case 'bibliotheque-load.php':
            // Chargement de la bibliothèque
            if (file_exists(__DIR__ . '/bibliotheque-load.php')) {
                require_once __DIR__ . '/bibliotheque-load.php';
            } else {
                handleSimpleError(404, "Fichier de chargement de la bibliothèque introuvable", ['path' => $path]);
            }
            exit;
            
        case 'bibliotheque-sync':
        case 'bibliotheque-sync.php':
            // Synchronisation de la bibliothèque
            if (file_exists(__DIR__ . '/bibliotheque-sync.php')) {
                require_once __DIR__ . '/bibliotheque-sync.php';
            } else {
                handleSimpleError(404, "Fichier de synchronisation de la bibliothèque introuvable", ['path' => $path]);
            }
            exit;
            
        case 'server-status':
        case 'server-status.php':
            // Diagnostic du statut du serveur
            if (file_exists(__DIR__ . '/server-status.php')) {
                require_once __DIR__ . '/server-status.php';
            } else {
                handleSimpleError(404, "Fichier de statut du serveur introuvable", ['path' => $path]);
            }
            exit;
            
        case 'phpinfo-test':
        case 'phpinfo-test.php':
            // Test phpinfo
            if (file_exists(__DIR__ . '/phpinfo-test.php')) {
                require_once __DIR__ . '/phpinfo-test.php';
            } else {
                handleSimpleError(404, "Fichier de test phpinfo introuvable", ['path' => $path]);
            }
            exit;
            
        case 'clear-log':
        case 'clear-log.php':
            // Nettoyage des logs
            if (file_exists(__DIR__ . '/clear-log.php')) {
                require_once __DIR__ . '/clear-log.php';
            } else {
                handleSimpleError(404, "Fichier de nettoyage des logs introuvable", ['path' => $path]);
            }
            exit;
            
        default:
            // Vérifier si le fichier existe directement (pour plus de flexibilité)
            $direct_file_path = __DIR__ . '/' . $path;
            $direct_file_path_with_php = __DIR__ . '/' . $path . '.php';
            
            if (file_exists($direct_file_path) && is_file($direct_file_path)) {
                try {
                    require_once $direct_file_path;
                } catch (Exception $e) {
                    handleSimpleError(500, "Erreur lors de l'exécution du fichier: {$path}", ['error' => $e->getMessage()]);
                }
                exit;
            }
            
            if (file_exists($direct_file_path_with_php) && is_file($direct_file_path_with_php)) {
                try {
                    require_once $direct_file_path_with_php;
                } catch (Exception $e) {
                    handleSimpleError(500, "Erreur lors de l'exécution du fichier: {$path}.php", ['error' => $e->getMessage()]);
                }
                exit;
            }
            
            // Si aucun contrôleur n'est trouvé, renvoyer une erreur 404
            handleSimpleError(404, "Point de terminaison non trouvé", ['path' => $path]);
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
            '/api/error-log' => 'Diagnostic des erreurs PHP et du serveur',
            '/api/server-status' => 'Statut du serveur',
            '/api/phpinfo-test' => 'Test phpinfo',
            '/api/clear-log' => 'Nettoyage des logs'
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
    handleSimpleError(500, "Erreur lors du traitement de la requête", ['error' => $e->getMessage()]);
} finally {
    // S'assurer que tout output est envoyé
    if (ob_get_length()) ob_end_flush();
}
?>
