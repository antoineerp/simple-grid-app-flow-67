
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

// Fonction pour créer des chemins si nécessaire
function ensureDirExists($path) {
    if (!is_dir($path)) {
        return mkdir($path, 0755, true);
    }
    return true;
}

// Vérifier les différents chemins possibles pour env.php
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

// Contenu correct pour env.php
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

// Créer le fichier dans tous les chemins possibles pour s'assurer qu'il est accessible
$results = [];
$success = false;

foreach ($env_paths as $path) {
    $dir = dirname($path);
    $created = false;
    $error = null;
    
    try {
        if (ensureDirExists($dir)) {
            $created = file_put_contents($path, $env_content) !== false;
            if ($created) {
                chmod($path, 0644);
                $success = true;
            }
        }
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
    
    $results[basename($dir) . '/' . basename($path)] = [
        'path' => $path,
        'created' => $created,
        'error' => $error
    ];
}

// Renvoyer le résultat
echo json_encode([
    'success' => $success,
    'message' => $success ? 'Le fichier env.php a été créé avec succès' : 'Échec de la création du fichier env.php',
    'existing' => $env_exists,
    'existing_path' => $env_path,
    'results' => $results,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
