
<?php
// Forcer le type de contenu JSON
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

// Sortie JSON simple
echo json_encode([
    'test' => 'ok',
    'message' => 'API PHP correctement configurée',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
