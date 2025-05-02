
<?php
// Simple endpoint pour vérifier la connectivité
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Répondre avec un statut simple
echo json_encode([
    "status" => "ok",
    "timestamp" => time(),
    "message" => "Le serveur est en ligne"
]);
?>
