
<?php
// Force l'encodage UTF-8 et désactive la mise en cache
header('Content-Type: application/json; charset=UTF-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Fonction pour obtenir une information sur le serveur de manière sécurisée
function get_server_info($key) {
    return isset($_SERVER[$key]) ? $_SERVER[$key] : 'Non disponible';
}

// Initialiser la réponse
$response = [
    'status' => 'success',
    'message' => 'Diagnostic API opérationnel',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_info' => [
        'version' => phpversion(),
        'sapi' => php_sapi_name(),
        'modules' => count(get_loaded_extensions()) . ' modules chargés',
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time') . ' secondes',
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'display_errors' => ini_get('display_errors'),
        'error_reporting' => ini_get('error_reporting')
    ],
    'server' => [
        'software' => get_server_info('SERVER_SOFTWARE'),
        'name' => get_server_info('SERVER_NAME'),
        'addr' => get_server_info('SERVER_ADDR'),
        'protocol' => get_server_info('SERVER_PROTOCOL'),
        'document_root' => get_server_info('DOCUMENT_ROOT'),
        'script_filename' => get_server_info('SCRIPT_FILENAME')
    ],
    'request' => [
        'method' => get_server_info('REQUEST_METHOD'),
        'uri' => get_server_info('REQUEST_URI'),
        'query_string' => get_server_info('QUERY_STRING'),
        'remote_addr' => get_server_info('REMOTE_ADDR'),
        'user_agent' => get_server_info('HTTP_USER_AGENT')
    ],
    'api_test' => [
        'plain_text' => 'Ceci est un test en texte brut',
        'html_content' => '<p>Ceci est un <strong>test HTML</strong></p>',
        'array_test' => ['a', 'b', 'c'],
        'object_test' => [
            'name' => 'Test Object',
            'id' => 12345,
            'active' => true
        ],
        'utf8_test' => 'Test avec caractères spéciaux : é è ê ë à ç ù'
    ],
    'files_check' => [
        'api_htaccess' => [
            'exists' => file_exists(__DIR__ . '/.htaccess'),
            'readable' => is_readable(__DIR__ . '/.htaccess'),
            'size' => file_exists(__DIR__ . '/.htaccess') ? filesize(__DIR__ . '/.htaccess') : 0
        ],
        'index_php' => [
            'exists' => file_exists(__DIR__ . '/index.php'),
            'readable' => is_readable(__DIR__ . '/index.php'),
            'size' => file_exists(__DIR__ . '/index.php') ? filesize(__DIR__ . '/index.php') : 0
        ],
        'login_test_php' => [
            'exists' => file_exists(__DIR__ . '/login-test.php'),
            'readable' => is_readable(__DIR__ . '/login-test.php'),
            'size' => file_exists(__DIR__ . '/login-test.php') ? filesize(__DIR__ . '/login-test.php') : 0
        ]
    ],
    'output_buffer' => [
        'active' => ob_get_level() > 0,
        'level' => ob_get_level(),
        'handlers' => ob_list_handlers()
    ]
];

// Afficher la réponse JSON avec indentation pour meilleure lisibilité
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
