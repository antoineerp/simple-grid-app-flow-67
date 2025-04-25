
<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

// Vérification de la structure des répertoires après déploiement
$directories = [
    '.' => 'Racine',
    './api' => 'API',
    './api/config' => 'Configuration API',
    './api/controllers' => 'Contrôleurs API',
    './api/middleware' => 'Middleware API',
    './api/models' => 'Modèles API',
    './api/models/traits' => 'Traits des modèles API',
    './api/operations' => 'Opérations API',
    './api/utils' => 'Utilitaires API',
    './assets' => 'Assets',
    './public' => 'Public',
    './public/lovable-uploads' => 'Uploads'
];

$results = [];
foreach ($directories as $dir => $name) {
    $exists = is_dir($dir);
    $results[$name] = [
        'path' => $dir,
        'exists' => $exists,
        'writable' => $exists ? is_writable($dir) : false,
        'files' => $exists ? count(scandir($dir)) - 2 : 0 // Moins . et ..
    ];
}

// Vérification des fichiers essentiels
$critical_files = [
    'index.html' => 'Page principale',
    'api/index.php' => 'Point d\'entrée API',
    'assets/index.js' => 'JavaScript principal'
];

foreach ($critical_files as $file => $name) {
    $exists = file_exists($file);
    $results['Files'][$name] = [
        'path' => $file,
        'exists' => $exists,
        'size' => $exists ? filesize($file) : 0,
        'timestamp' => $exists ? date('Y-m-d H:i:s', filemtime($file)) : null
    ];
}

// Information sur le déploiement
$deployment_info = [
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_SOFTWARE'],
    'php_version' => phpversion(),
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'memory_limit' => ini_get('memory_limit')
];

$response = [
    'status' => 'success',
    'message' => 'Vérification du déploiement terminée',
    'deployment_info' => $deployment_info,
    'directories' => $results,
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
