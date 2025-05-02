
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
    'assets' => $rootPath . '/assets',
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
    
    // Si c'est le dossier assets, lister son contenu
    if ($exists && ($name === 'assets' || $name === 'dist')) {
        $pathInfo['directory_structure'][$name]['contents'] = scandir($path);
    }
}

// Vérifier l'existence des fichiers principaux
$filesToCheck = [
    'index.html' => $rootPath . '/index.html',
    '.htaccess' => $rootPath . '/.htaccess',
    'assets/.htaccess' => $rootPath . '/assets/.htaccess',
    'assets/index.js' => $rootPath . '/assets/index.js',
    'vite.config.ts' => $rootPath . '/vite.config.ts'
];

foreach ($filesToCheck as $name => $path) {
    $exists = file_exists($path);
    $pathInfo['files'][$name] = [
        'path' => $path,
        'exists' => $exists,
        'readable' => $exists ? is_readable($path) : false,
        'size' => $exists ? filesize($path) : 0
    ];
    
    // Si c'est index.html, vérifier son contenu
    if ($exists && $name === 'index.html') {
        $content = file_get_contents($path);
        $pathInfo['files'][$name]['script_references'] = [];
        
        // Extraire les balises script
        preg_match_all('/<script[^>]*src="([^"]*)"[^>]*><\/script>/', $content, $matches);
        if (!empty($matches[1])) {
            foreach ($matches[1] as $scriptSrc) {
                $pathInfo['files'][$name]['script_references'][] = $scriptSrc;
            }
        }
        
        // Vérifier si les chemins sont relatifs
        $pathInfo['files'][$name]['has_absolute_paths'] = false;
        foreach ($pathInfo['files'][$name]['script_references'] as $src) {
            if (strpos($src, '/') === 0) {
                $pathInfo['files'][$name]['has_absolute_paths'] = true;
                break;
            }
        }
    }
}

// Vérifier si l'application pourrait avoir des problèmes connus
$pathInfo['potential_issues'] = [];

// Vérifier les chemins absolus dans index.html
if (isset($pathInfo['files']['index.html']) && $pathInfo['files']['index.html']['exists'] && $pathInfo['files']['index.html']['has_absolute_paths']) {
    $pathInfo['potential_issues'][] = [
        'type' => 'path',
        'severity' => 'high',
        'message' => 'Le fichier index.html contient des chemins absolus pour les scripts, ce qui peut poser problème sur Infomaniak',
        'fix' => 'Remplacer les chemins absolus (commençant par /) par des chemins relatifs'
    ];
}

// Vérifier si index.js existe
if (!isset($pathInfo['files']['assets/index.js']) || !$pathInfo['files']['assets/index.js']['exists']) {
    $pathInfo['potential_issues'][] = [
        'type' => 'missing_file',
        'severity' => 'high',
        'message' => 'Le fichier assets/index.js est manquant',
        'fix' => 'Créer le fichier assets/index.js avec le contenu compatible Infomaniak'
    ];
}

// Vérifier si le .htaccess principal existe
if (!isset($pathInfo['files']['.htaccess']) || !$pathInfo['files']['.htaccess']['exists']) {
    $pathInfo['potential_issues'][] = [
        'type' => 'missing_file',
        'severity' => 'critical',
        'message' => 'Le fichier .htaccess principal est manquant',
        'fix' => 'Créer le fichier .htaccess avec les configurations nécessaires'
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
