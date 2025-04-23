
<?php
// Headers essentiels pour un fonctionnement correct
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Pragma: no-cache");
header("Expires: 0");

// Informations de diagnostic basiques
$data = [
    'status' => 'success',
    'message' => 'API PHP simplifiée fonctionnelle',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
    'host' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown'
];

// S'assurer que la sortie est propre (pas d'espace ou de BOM avant le JSON)
ob_clean();
echo json_encode($data, JSON_PRETTY_PRINT);
exit;
?>
