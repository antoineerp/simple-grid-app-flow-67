
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Définir explicitement le type de contenu
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Test de base pour vérifier que PHP est exécuté
$php_execution = true;
$php_version = phpversion();
$server_software = $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible';

// Vérifier les extensions PHP critiques
$extensions = [
    'json' => extension_loaded('json'),
    'pdo' => extension_loaded('pdo'),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'mbstring' => extension_loaded('mbstring')
];

// Informations sur le serveur
$server_info = [
    'hostname' => $_SERVER['SERVER_NAME'] ?? 'Non disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non disponible',
    'php_self' => $_SERVER['PHP_SELF'] ?? 'Non disponible'
];

// Liste des fichiers dans le répertoire /assets (si disponible)
$assets_path = realpath(__DIR__ . '/../assets');
$assets_files = [];
$assets_exists = false;

if ($assets_path && is_dir($assets_path)) {
    $assets_exists = true;
    $files = glob($assets_path . '/*.*');
    
    foreach ($files as $file) {
        $assets_files[] = [
            'name' => basename($file),
            'size' => filesize($file),
            'modified' => date('Y-m-d H:i:s', filemtime($file)),
            'type' => mime_content_type($file)
        ];
    }
}

// Vérifier les fichiers de configuration PHP importants
$config_files = [
    '.htaccess' => file_exists(__DIR__ . '/.htaccess'),
    'php.ini' => file_exists(__DIR__ . '/php.ini'),
    '.user.ini' => file_exists(__DIR__ . '/.user.ini'),
    'api/index.php' => file_exists(__DIR__ . '/index.php'),
    'api/auth.php' => file_exists(__DIR__ . '/auth.php'),
];

// Tester le fichier index.html
$index_html_path = __DIR__ . '/../index.html';
$index_html_exists = file_exists($index_html_path);
$index_html_contents = $index_html_exists ? substr(file_get_contents($index_html_path), 0, 500) . '...' : 'Non disponible';

// Résultat final
$result = [
    'status' => 'success',
    'message' => 'Test d\'exécution PHP réussi',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_info' => [
        'version' => $php_version,
        'execution' => $php_execution,
        'extensions' => $extensions
    ],
    'server_info' => $server_info,
    'server_software' => $server_software,
    'assets' => [
        'directory_exists' => $assets_exists,
        'path' => $assets_path,
        'files_count' => count($assets_files),
        'files' => $assets_files
    ],
    'config_files' => $config_files,
    'index_html' => [
        'exists' => $index_html_exists,
        'preview' => $index_html_contents
    ]
];

// Envoyer la réponse JSON
echo json_encode($result, JSON_PRETTY_PRINT);

// Vider le tampon de sortie
ob_end_flush();
?>
