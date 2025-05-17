
<?php
// Point d'entrée pour vérifier l'état de l'API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier que les fichiers API essentiels existent
$apiFiles = [
    'index.php',
    'auth.php',
    'login.php',
    'auth-test.php',
    'check-db-connection.php'
];

$missingFiles = [];
foreach ($apiFiles as $file) {
    if (!file_exists(__DIR__ . '/' . $file)) {
        $missingFiles[] = $file;
    }
}

// Créer automatiquement le fichier env.php s'il n'existe pas
if (!file_exists(__DIR__ . '/config/env.php') && file_exists(__DIR__ . '/config/env.example.php')) {
    copy(__DIR__ . '/config/env.example.php', __DIR__ . '/config/env.php');
    $envCreated = true;
} else {
    $envCreated = false;
}

// Créer le fichier .htaccess si nécessaire
if (!file_exists(__DIR__ . '/.htaccess')) {
    $htaccessContent = "
# Active la réécriture d'URL
RewriteEngine On

# Gère les headers CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin \"*\"
    Header set Access-Control-Allow-Methods \"GET, POST, PUT, DELETE, OPTIONS\"
    Header set Access-Control-Allow-Headers \"Content-Type, Authorization\"
    
    # En cas de requête OPTIONS (CORS preflight), renvoyer un 200 OK
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>

# Redirection vers index.php pour les requêtes non-existantes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
";
    file_put_contents(__DIR__ . '/.htaccess', $htaccessContent);
    $htaccessCreated = true;
} else {
    $htaccessCreated = false;
}

// Renvoyer une réponse de test
echo json_encode([
    'success' => true,
    'message' => 'API PHP disponible',
    'status' => 200,
    'environment' => 'production',
    'server_info' => [
        'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
        'uri' => $_SERVER['REQUEST_URI'] ?? '/',
        'script' => $_SERVER['SCRIPT_NAME'] ?? '/api/check.php'
    ],
    'api_status' => [
        'missing_files' => $missingFiles,
        'env_created' => $envCreated,
        'htaccess_created' => $htaccessCreated,
        'php_version' => phpversion()
    ]
]);
?>
