
<?php
// Fichier pour afficher les informations de configuration PHP
// Utile pour le diagnostic et le débogage

// Définir les en-têtes
header("Content-Type: text/html; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser l'accès
error_log("Accès à phpinfo.php");

// Déterminer si nous sommes dans un mode API ou HTML
$wantJson = false;

// Vérifier si l'en-tête Accept contient application/json
if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
    $wantJson = true;
}

// Vérifier si le paramètre format=json est présent dans l'URL
if (isset($_GET['format']) && $_GET['format'] === 'json') {
    $wantJson = true;
}

// Si nous voulons du JSON, récupérer les informations PHP dans un format structuré
if ($wantJson) {
    header("Content-Type: application/json; charset=UTF-8");
    
    // Collecter les informations PHP importantes
    $phpInfo = [
        'version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'unknown',
        'extensions' => get_loaded_extensions(),
        'modules' => [
            'pdo' => extension_loaded('pdo'),
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'mysqli' => extension_loaded('mysqli'),
            'json' => extension_loaded('json'),
            'curl' => extension_loaded('curl'),
            'mbstring' => extension_loaded('mbstring'),
            'openssl' => extension_loaded('openssl'),
            'gd' => extension_loaded('gd'),
        ],
        'ini' => [
            'display_errors' => ini_get('display_errors'),
            'error_reporting' => ini_get('error_reporting'),
            'memory_limit' => ini_get('memory_limit'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'max_execution_time' => ini_get('max_execution_time'),
            'default_charset' => ini_get('default_charset'),
            'allow_url_fopen' => ini_get('allow_url_fopen'),
        ]
    ];
    
    echo json_encode($phpInfo, JSON_PRETTY_PRINT);
} else {
    // Sinon afficher la sortie standard de phpinfo()
    phpinfo();
}
?>
