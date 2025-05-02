
<?php
// Force output buffering to prevent output before headers
ob_start();

// Configuration des headers
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

// Collecter les informations sur les chemins d'accès
$pathInfo = [
    'server' => [
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'non défini',
        'server_addr' => $_SERVER['SERVER_ADDR'] ?? 'non défini',
        'http_host' => $_SERVER['HTTP_HOST'] ?? 'non défini',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'non défini',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'non défini',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'non défini',
        'php_self' => $_SERVER['PHP_SELF'] ?? 'non défini'
    ],
    'php_info' => [
        'version' => phpversion(),
        'extensions' => get_loaded_extensions()
    ],
    'directory_structure' => []
];

// Vérifier si nous sommes dans un environnement Infomaniak
$isInfomaniak = (strpos($_SERVER['SERVER_NAME'] ?? '', 'infomaniak') !== false) || 
                (strpos($_SERVER['SERVER_NAME'] ?? '', 'qualiopi.ch') !== false);

$pathInfo['is_infomaniak'] = $isInfomaniak;

// Déterminer le chemin racine du projet
$rootPath = dirname(__DIR__);
$apiPath = __DIR__;

// Vérifier l'existence des dossiers importants
$dirsToCheck = [
    'api' => $apiPath,
    'api/config' => $apiPath . '/config',
    'api/controllers' => $apiPath . '/controllers',
    'dist' => $rootPath . '/dist',
    'sites' => '/sites'
];

foreach ($dirsToCheck as $name => $path) {
    $exists = is_dir($path);
    $pathInfo['directory_structure'][$name] = [
        'path' => $path,
        'exists' => $exists,
        'readable' => $exists ? is_readable($path) : false,
        'writable' => $exists ? is_writable($path) : false
    ];
    
    // Si c'est le dossier dist, lister son contenu
    if ($exists && $name === 'dist') {
        $pathInfo['directory_structure'][$name]['contents'] = scandir($path);
    }
}

// Vérifier l'existence des fichiers principaux de l'API
$filesToCheck = [
    'index.php' => $apiPath . '/index.php',
    'config/env.php' => $apiPath . '/config/env.php',
    'config/database.php' => $apiPath . '/config/database.php',
    'controllers/AuthController.php' => $apiPath . '/controllers/AuthController.php',
    'dist/index.html' => $rootPath . '/dist/index.html'
];

foreach ($filesToCheck as $name => $path) {
    $exists = file_exists($path);
    $pathInfo['files'][$name] = [
        'path' => $path,
        'exists' => $exists,
        'readable' => $exists ? is_readable($path) : false,
        'size' => $exists ? filesize($path) : 0
    ];
}

// Vérification de l'existence de sites/qualiopi.ch/api si on est chez Infomaniak
if ($isInfomaniak) {
    $infomaniakApiPath = '/sites/qualiopi.ch/api';
    $pathInfo['infomaniak_paths'] = [
        'sites_exists' => is_dir('/sites'),
        'sites_qualiopi_ch_exists' => is_dir('/sites/qualiopi.ch'),
        'sites_qualiopi_ch_api_exists' => is_dir($infomaniakApiPath)
    ];
    
    // Si le dossier existe, vérifier quelques fichiers clés
    if (is_dir($infomaniakApiPath)) {
        $infomaniakFilesToCheck = [
            'index.php' => $infomaniakApiPath . '/index.php', 
            'config/database.php' => $infomaniakApiPath . '/config/database.php'
        ];
        
        foreach ($infomaniakFilesToCheck as $name => $path) {
            $exists = file_exists($path);
            $pathInfo['infomaniak_paths']['files'][$name] = [
                'exists' => $exists,
                'readable' => $exists ? is_readable($path) : false,
                'size' => $exists ? filesize($path) : 0
            ];
        }
    }
}

// Ajouter des informations sur la base de données si possible
try {
    if (file_exists($apiPath . '/config/database.php')) {
        require_once $apiPath . '/config/database.php';
        $database = new Database();
        $dbConfig = $database->getConfig();
        
        // Ne pas exposer le mot de passe
        if (isset($dbConfig['password'])) {
            $dbConfig['password'] = '********';
        }
        
        $pathInfo['database'] = [
            'config' => $dbConfig,
            'connection_test' => $database->testConnection()
        ];
    }
} catch (Exception $e) {
    $pathInfo['database'] = [
        'error' => $e->getMessage()
    ];
}

// Envoyer la réponse
echo json_encode([
    'status' => 'success',
    'message' => 'Informations sur les chemins d\'accès et l\'environnement récupérées',
    'timestamp' => date('Y-m-d H:i:s'),
    'path_info' => $pathInfo
]);

// S'assurer que tout buffer est vidé
if (ob_get_level()) ob_end_flush();
?>
