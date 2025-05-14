
<?php
// Script de diagnostic CORS
require_once 'utils/CorsHelper.php';

// Configurer les en-têtes CORS pour ce test
CorsHelper::setupCors("*", "GET, POST, OPTIONS", "application/json");

// Récupérer tous les en-têtes de requête
$requestHeaders = getallheaders();

// Créer la réponse
$response = [
    'status' => 'success',
    'message' => 'Diagnostic CORS',
    'request' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'Non définie',
        'headers' => $requestHeaders
    ],
    'server' => [
        'software' => $_SERVER['SERVER_SOFTWARE'],
        'php_version' => phpversion(),
        'protocol' => $_SERVER['SERVER_PROTOCOL']
    ],
    'cors' => [
        'allowed_origin' => '*',
        'allowed_methods' => 'GET, POST, OPTIONS, PUT, DELETE',
        'allowed_headers' => 'Content-Type, Authorization, X-Requested-With, X-Device-ID'
    ],
    'apache_modules' => function_exists('apache_get_modules') ? 
                          array_filter(apache_get_modules(), function($module) {
                              return strpos($module, 'headers') !== false || strpos($module, 'rewrite') !== false;
                          }) : 
                          'Non disponible'
];

// Vérifier la configuration .htaccess
$htaccessPath = __DIR__ . '/.htaccess';
$response['htaccess'] = [
    'exists' => file_exists($htaccessPath),
    'readable' => is_readable($htaccessPath),
    'cors_config' => file_exists($htaccessPath) ? 
                    (strpos(file_get_contents($htaccessPath), 'Access-Control-Allow') !== false) : 
                    false
];

// Vérifier si une requête spécifique est testée
$testUrl = isset($_GET['testUrl']) ? $_GET['testUrl'] : null;

if ($testUrl) {
    // Tester une requête CORS vers l'URL spécifiée
    $ch = curl_init($testUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Origin: https://qualiopi.ch']);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $response['test_request'] = [
        'url' => $testUrl,
        'status_code' => $httpCode,
        'headers' => $result ? explode("\n", $result) : 'Erreur lors de la requête'
    ];
}

// Renvoyer la réponse
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
