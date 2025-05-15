
<?php
// Définir explicitement le type de contenu
header('Content-Type: application/json; charset=UTF-8');

// Désactiver la mise en cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Configuration CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Récupérer les informations système
$php_version = phpversion();
$server_software = $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible';
$document_root = $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible';

// Vérifier si env.php existe
$env_paths = [
    __DIR__ . '/config/env.php',
    dirname(__DIR__) . '/api/config/env.php',
    './api/config/env.php',
    '../api/config/env.php',
];

$env_exists = false;
$env_path = null;

foreach ($env_paths as $path) {
    if (file_exists($path)) {
        $env_exists = true;
        $env_path = $path;
        break;
    }
}

// Vérifier si le dossier config existe
$config_dir = __DIR__ . '/config';
$config_dir_exists = is_dir($config_dir);

// Créer le dossier config s'il n'existe pas
if (!$config_dir_exists) {
    mkdir($config_dir, 0755, true);
}

// Créer env.php s'il n'existe pas
$env_content = '<?php
// Configuration des variables d\'environnement pour Infomaniak
define("DB_HOST", "p71x6d.myd.infomaniak.com");
define("DB_NAME", "p71x6d_richard");
define("DB_USER", "p71x6d_richard");
define("DB_PASS", "Trottinette43!");
define("API_BASE_URL", "/api");
define("APP_ENV", "production");

// Fonction d\'aide pour récupérer les variables d\'environnement
function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $default;
}

// Alias pour compatibilité avec différentes syntaxes
if (!function_exists("env")) {
    function env($key, $default = null) {
        return get_env($key, $default);
    }
}
?>';

$env_created = false;
if (!$env_exists) {
    $new_env_path = $config_dir . '/env.php';
    $env_created = file_put_contents($new_env_path, $env_content) !== false;
    $env_path = $new_env_path;
}

// Vérifier le contenu de env.php
$env_content_ok = false;
if ($env_exists || $env_created) {
    $current_content = file_get_contents($env_path);
    $env_content_ok = strpos($current_content, 'define("DB_HOST"') !== false;
}

// Renvoyer les résultats
echo json_encode([
    'success' => true,
    'php_working' => true,
    'php_version' => $php_version,
    'server_software' => $server_software,
    'document_root' => $document_root,
    'env_status' => [
        'exists' => $env_exists || $env_created,
        'path' => $env_path,
        'created' => $env_created,
        'content_ok' => $env_content_ok
    ],
    'config_dir' => [
        'exists' => $config_dir_exists,
        'path' => $config_dir
    ],
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
