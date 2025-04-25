
<?php
// Script de diagnostic pour identifier les problèmes de chemin et de routage
header('Content-Type: application/json');

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Autoriser les requêtes CORS pour le développement
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Collecter les informations sur les chemins
$paths = [
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini',
    'php_self' => $_SERVER['PHP_SELF'] ?? 'Non défini',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non défini',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Non défini',
    'path_info' => $_SERVER['PATH_INFO'] ?? 'Non défini',
    'path_translated' => $_SERVER['PATH_TRANSLATED'] ?? 'Non défini',
];

$directories = [
    'api_dir' => [
        'path' => dirname(__FILE__),
        'exists' => is_dir(dirname(__FILE__)),
        'readable' => is_readable(dirname(__FILE__)),
        'writable' => is_writable(dirname(__FILE__)),
    ],
    'parent_dir' => [
        'path' => dirname(dirname(__FILE__)),
        'exists' => is_dir(dirname(dirname(__FILE__))),
        'readable' => is_readable(dirname(dirname(__FILE__))),
        'writable' => is_writable(dirname(dirname(__FILE__))),
    ],
    'index_html' => [
        'path' => dirname(dirname(__FILE__)) . '/index.html',
        'exists' => file_exists(dirname(dirname(__FILE__)) . '/index.html'),
        'readable' => is_readable(dirname(dirname(__FILE__)) . '/index.html'),
        'size' => file_exists(dirname(dirname(__FILE__)) . '/index.html') ? filesize(dirname(dirname(__FILE__)) . '/index.html') : 0,
    ],
    'assets_dir' => [
        'path' => dirname(dirname(__FILE__)) . '/assets',
        'exists' => is_dir(dirname(dirname(__FILE__)) . '/assets'),
        'files' => is_dir(dirname(dirname(__FILE__)) . '/assets') ? scandir(dirname(dirname(__FILE__)) . '/assets') : [],
    ]
];

// Tester l'exécution PHP
$php_working = true;
$php_version = phpversion();
$extensions = get_loaded_extensions();

// Tester le système de fichiers
$filesystem = [
    'can_read_self' => is_readable(__FILE__),
    'api_files' => scandir(dirname(__FILE__)),
    'temp_writable' => is_writable(sys_get_temp_dir()),
    'current_dir' => getcwd(),
];

// Préparer la réponse
$response = [
    'status' => 'success',
    'message' => 'Diagnostic des chemins terminé',
    'timestamp' => date('Y-m-d H:i:s'),
    'paths' => $paths,
    'directories' => $directories,
    'php_info' => [
        'version' => $php_version,
        'working' => $php_working,
        'extensions' => $extensions,
    ],
    'filesystem' => $filesystem,
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
