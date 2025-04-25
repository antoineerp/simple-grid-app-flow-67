
<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Éviter toute sortie avant les headers
ob_start();

// Configuration
$tests = [
    'php_execution' => [
        'url' => '/php-execution-test.php',
        'description' => 'Test d\'exécution PHP standard'
    ],
    'php_execution_api' => [
        'url' => '/api/php-execution-test.php',
        'description' => 'Test d\'exécution PHP via API'
    ],
    'info' => [
        'url' => '/info.php',
        'description' => 'Info PHP standard'
    ],
    'info_api' => [
        'url' => '/api/info.php',
        'description' => 'Info PHP via API'
    ]
];

// Collecte les résultats
$results = [
    'timestamp' => time(),
    'server' => $_SERVER['SERVER_SOFTWARE'],
    'host' => $_SERVER['HTTP_HOST'],
    'script_path' => $_SERVER['SCRIPT_NAME'],
    'uri' => $_SERVER['REQUEST_URI'],
    'tests' => []
];

// Fonction pour tester l'accès à une URL
function testUrl($url) {
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
    $fullUrl = "$protocol://$host$url";
    
    $ch = curl_init($fullUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    
    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'status_code' => $httpcode,
        'content_type' => $contentType,
        'url' => $fullUrl,
        'error' => $error ?: null,
        'success' => ($httpcode >= 200 && $httpcode < 300)
    ];
}

// Exécuter les tests
foreach ($tests as $key => $test) {
    $results['tests'][$key] = array_merge(
        $test,
        testUrl($test['url'])
    );
}

// Ajouter des informations sur la configuration PHP
$results['php_info'] = [
    'version' => phpversion(),
    'modules' => get_loaded_extensions(),
    'server_api' => php_sapi_name(),
    'display_errors' => ini_get('display_errors'),
    'error_reporting' => ini_get('error_reporting'),
    'rewrite_module' => isset($_SERVER['REDIRECT_URL']) ? 'Seems active' : 'Status unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT']
];

// Envoyer la réponse JSON
echo json_encode($results, JSON_PRETTY_PRINT);

// Vider le buffer et terminer
ob_end_flush();
?>
