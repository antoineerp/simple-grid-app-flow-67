
<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Chemins à vérifier dynamiquement
function getPaths() {
    return [
        __DIR__,
        __DIR__ . '/config',
        __DIR__ . '/middleware',
        __DIR__ . '/.htaccess',
        __DIR__ . '/index.php',
        __DIR__ . '/controllers',
        __DIR__ . '/models',
        __DIR__ . '/operations'
    ];
}

function checkPermissions($path) {
    clearstatcache(); // Nettoyer le cache des fichiers

    $info = [
        'path' => $path,
        'exists' => file_exists($path),
        'readable' => is_readable($path),
        'writable' => is_writable($path),
        'executable' => is_executable($path) || (is_dir($path) && is_readable($path))
    ];

    // Informations supplémentaires pour les fichiers/dossiers
    if ($info['exists']) {
        $info['type'] = is_dir($path) ? 'directory' : 'file';
        $info['size'] = is_file($path) ? filesize($path) : null;
        $info['last_modified'] = date('Y-m-d H:i:s', filemtime($path));
        $info['owner'] = function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($path))['name'] : null;
        $info['group'] = function_exists('posix_getgrgid') ? posix_getgrgid(filegroup($path))['name'] : null;
    }

    return $info;
}

try {
    $results = [];
    foreach (getPaths() as $path) {
        $results[] = checkPermissions($path);
    }

    // Vérification des permissions globales
    $has_global_write_access = array_reduce($results, function($carry, $item) {
        return $carry && $item['writable'];
    }, true);

    $response = [
        'status' => 'success',
        'global_write_access' => $has_global_write_access,
        'paths' => $results,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du diagnostic des permissions',
        'error_details' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>

