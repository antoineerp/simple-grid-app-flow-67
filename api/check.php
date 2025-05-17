
<?php
// API Health Check Script
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Informations sur le serveur
$serverInfo = [
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'php_version' => phpversion(),
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
    'http_host' => $_SERVER['HTTP_HOST'] ?? 'Unknown'
];

// Vérifier le fichier env.php
$envFile = __DIR__ . '/config/env.php';
$envStatus = [
    'exists' => file_exists($envFile),
    'created' => false
];

// Si env.php n'existe pas, le créer
if (!$envStatus['exists']) {
    // Créer le dossier config s'il n'existe pas
    if (!is_dir(__DIR__ . '/config')) {
        mkdir(__DIR__ . '/config', 0755, true);
    }
    
    // Contenu du fichier env.php
    $envContent = <<<'EOT'
<?php
// Configuration des variables d'environnement pour Infomaniak
define('DB_HOST', 'p71x6d.myd.infomaniak.com');
define('DB_NAME', 'p71x6d_richard');
define('DB_USER', 'p71x6d_richard');
define('DB_PASS', 'Trottinette43!');
define('API_BASE_URL', '/api');
define('APP_ENV', 'production');

// Fonction d'aide pour récupérer les variables d'environnement
function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $default;
}

// Alias pour compatibilité avec différentes syntaxes
if (!function_exists('env')) {
    function env($key, $default = null) {
        return get_env($key, $default);
    }
}
?>
EOT;

    // Écrire le fichier env.php
    if (file_put_contents($envFile, $envContent)) {
        $envStatus['created'] = true;
        $envStatus['exists'] = true;
    }
}

// Tester la connexion à la base de données
$dbStatus = [
    'host' => 'p71x6d.myd.infomaniak.com',
    'name' => 'p71x6d_richard',
    'connection_ok' => false
];

try {
    if (class_exists('PDO')) {
        $pdo = new PDO(
            'mysql:host=p71x6d.myd.infomaniak.com;dbname=p71x6d_richard',
            'p71x6d_richard',
            'Trottinette43!'
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $dbStatus['connection_ok'] = true;
    }
} catch (PDOException $e) {
    $dbStatus['error'] = $e->getMessage();
}

// Renvoyer la réponse
echo json_encode([
    'success' => true,
    'message' => 'API PHP disponible',
    'status' => 200,
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => $serverInfo,
    'php_working' => true,
    'env_status' => $envStatus,
    'db_status' => $dbStatus
]);
?>
