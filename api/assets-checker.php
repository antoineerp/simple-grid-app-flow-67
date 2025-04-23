
<?php
// Script pour vérifier l'accessibilité des assets sur Infomaniak
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");

function check_file_access($path) {
    $full_path = $_SERVER['DOCUMENT_ROOT'] . $path;
    $exists = file_exists($full_path);
    $readable = is_readable($full_path);
    $size = $exists ? filesize($full_path) : 0;
    
    return [
        'path' => $path,
        'full_path' => $full_path,
        'exists' => $exists,
        'readable' => $readable,
        'size' => $size,
        'permissions' => $exists ? substr(sprintf('%o', fileperms($full_path)), -4) : 'N/A'
    ];
}

// Liste des chemins à vérifier
$paths_to_check = [
    '/assets/index.js',
    '/index.html',
    '/api/index.php',
    '/api/verify-php-execution.php',
    '/api/infomaniak-check.php'
];

// Vérifier tous les fichiers
$results = [];
foreach ($paths_to_check as $path) {
    $results[$path] = check_file_access($path);
}

// Vérifier les fichiers javascript dans assets avec leur hash
$assets_dir = $_SERVER['DOCUMENT_ROOT'] . '/assets';
$js_files = [];
$css_files = [];

if (is_dir($assets_dir)) {
    $files = scandir($assets_dir);
    foreach ($files as $file) {
        if (strpos($file, '.js') !== false) {
            $js_files[] = check_file_access('/assets/' . $file);
        } else if (strpos($file, '.css') !== false) {
            $css_files[] = check_file_access('/assets/' . $file);
        }
    }
}

// Créer la réponse
$response = [
    'status' => 'success',
    'message' => 'Vérification des assets terminée',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'document_root' => $_SERVER['DOCUMENT_ROOT'],
        'script_filename' => $_SERVER['SCRIPT_FILENAME'],
        'host' => $_SERVER['HTTP_HOST'],
        'php_version' => phpversion()
    ],
    'file_checks' => $results,
    'js_files' => $js_files,
    'css_files' => $css_files
];

// Envoyer la réponse
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
