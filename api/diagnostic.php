
<?php
// Définir explicitement l'encodage UTF-8
header('Content-Type: application/json; charset=utf-8');
mb_internal_encoding('UTF-8');

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Autoriser l'accès CORS pour le débogage
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Journaliser l'accès
error_log('Diagnostic API accessed from: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

// Fonction pour obtenir une information sur le serveur de manière sécurisée
function get_server_info($key) {
    return isset($_SERVER[$key]) ? $_SERVER[$key] : 'non disponible';
}

// Vérifier l'environnement PHP
$phpVersion = phpversion();
$modules = get_loaded_extensions();
$docRoot = get_server_info('DOCUMENT_ROOT');
$scriptFilename = get_server_info('SCRIPT_FILENAME');
$requestUri = get_server_info('REQUEST_URI');
$httpHost = get_server_info('HTTP_HOST');

// Vérifier l'existence de fichiers clés
$indexHtml = file_exists('../index.html');
$mainHtaccess = file_exists('../.htaccess');
$apiHtaccess = file_exists('./.htaccess');
$apiIndex = file_exists('./index.php');
$assetsDir = is_dir('../assets');

// Vérifier le fichier de configuration d'environnement
$configExists = file_exists('./config/env.php');
$configJson = file_exists('./config/app_config.json');

// Préparation de la réponse
$response = [
    'status' => 200,
    'message' => 'Diagnostic API fonctionnel',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => $phpVersion,
        'loaded_modules' => count($modules),
        'document_root' => $docRoot,
        'script_filename' => $scriptFilename,
        'request_uri' => $requestUri,
        'http_host' => $httpHost
    ],
    'files_check' => [
        'index_html' => $indexHtml,
        'root_htaccess' => $mainHtaccess,
        'api_htaccess' => $apiHtaccess,
        'api_index' => $apiIndex,
        'assets_directory' => $assetsDir,
        'env_config' => $configExists,
        'app_config_json' => $configJson
    ]
];

// Si l'API est configurée, inclure les informations de configuration
if ($configExists) {
    // Vérifier si la fonction env() existe déjà, sinon la définir
    if (!function_exists('env')) {
        function env($key, $default = null) {
            // Fonction minimale de secours
            return $default;
        }
    }
    
    // Essayer d'inclure le fichier de configuration sans planter
    try {
        include_once './config/env.php';
        
        // Récupérer les variables d'environnement en utilisant la fonction env()
        $response['environment'] = env('APP_ENV', 'non défini');
        $response['api_urls'] = [
            'dev' => env('API_URL_DEV', 'non défini'),
            'prod' => env('API_URL_PROD', 'non défini')
        ];
        $response['cors'] = [
            'dev' => env('ALLOWED_ORIGIN_DEV', 'non défini'),
            'prod' => env('ALLOWED_ORIGIN_PROD', 'non défini')
        ];
    } catch (Exception $e) {
        $response['config_error'] = $e->getMessage();
    }
}

// Vérifier si le fichier app_config.json existe et est lisible
if ($configJson) {
    try {
        $jsonContent = file_get_contents('./config/app_config.json');
        $jsonData = json_decode($jsonContent, true);
        if ($jsonData) {
            $response['app_config'] = $jsonData;
        } else {
            $response['app_config_error'] = 'Format JSON invalide';
        }
    } catch (Exception $e) {
        $response['app_config_error'] = $e->getMessage();
    }
}

// Retourner la réponse en JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
