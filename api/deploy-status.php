
<?php
/**
 * API pour vérifier le statut du déploiement
 * Format standardisé pour toutes les API de l'application
 */

// En-têtes communs pour tous les endpoints API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Chercher des fichiers critiques
$critical_files = [
    'index.html' => 'Fichier HTML principal',
    'assets/main.css' => 'Feuille de style principale',
    'assets/index.css' => 'Feuille de style additionnelle',
    'assets/main.js' => 'Script JavaScript principal',
    'assets/index.js' => 'Script JavaScript d\'entrée',
    'api/.htaccess' => 'Configuration du serveur API',
    'api/config/env.php' => 'Configuration de l\'environnement'
];

$file_status = [];
foreach ($critical_files as $file => $description) {
    $full_path = dirname(__DIR__) . '/' . $file;
    $file_status[$file] = [
        'exists' => file_exists($full_path),
        'size' => file_exists($full_path) ? filesize($full_path) : 0,
        'description' => $description
    ];
}

// Chercher des fichiers d'assets avec hash
$js_hashed_files = [];
$css_hashed_files = [];

if (is_dir(dirname(__DIR__) . '/assets')) {
    $assets = scandir(dirname(__DIR__) . '/assets');
    foreach ($assets as $asset) {
        if (preg_match('/\.(js)$/', $asset)) {
            $js_hashed_files[] = $asset;
        } elseif (preg_match('/\.(css)$/', $asset)) {
            $css_hashed_files[] = $asset;
        }
    }
}

// Détecter l'environnement
$isProduction = strpos($_SERVER['HTTP_HOST'] ?? '', 'qualiopi.ch') !== false;
$isStaging = strpos($_SERVER['HTTP_HOST'] ?? '', '.lovable.') !== false;
$environment = $isProduction ? 'production' : ($isStaging ? 'staging' : 'development');

// Construire la réponse
$response = [
    'success' => true,
    'message' => 'Statut du déploiement',
    'code' => 200,
    'data' => [
        'environment' => $environment,
        'server' => [
            'php_version' => phpversion(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
            'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
            'timestamp' => date('Y-m-d\TH:i:s\Z')
        ],
        'files' => $file_status,
        'assets' => [
            'js_files' => $js_hashed_files,
            'css_files' => $css_hashed_files
        ]
    ]
];

// Envoyer la réponse JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
