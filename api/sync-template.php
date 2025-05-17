
<?php
/**
 * Template standard pour les endpoints de synchronisation
 * À utiliser comme base pour tous les endpoints de synchronisation
 */

// En-têtes communs pour tous les endpoints API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-ID');

// Inclure la classe ResponseHandler
require_once __DIR__ . '/utils/ResponseHandler.php';

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier que la méthode HTTP est appropriée (GET pour load, POST pour sync)
$allowedMethod = 'GET'; // ou 'POST' selon l'endpoint
if ($_SERVER['REQUEST_METHOD'] !== $allowedMethod) {
    ResponseHandler::error(
        "Méthode non autorisée. Utilisez $allowedMethod.",
        405
    );
}

// Récupérer et valider les paramètres communs
$userId = $_GET['userId'] ?? null; // Pour GET
// $userId = json_decode(file_get_contents('php://input'), true)['userId'] ?? null; // Pour POST

$deviceId = $_GET['deviceId'] ?? null; // Pour GET
// $deviceId = json_decode(file_get_contents('php://input'), true)['deviceId'] ?? null; // Pour POST

if (!$userId || !$deviceId) {
    ResponseHandler::error(
        'Paramètres manquants. userId et deviceId sont requis.',
        400
    );
}

try {
    // Logique spécifique à l'endpoint ici
    
    // Exemple de données pour endpoint de chargement
    $data = [
        // Données spécifiques à l'entité
    ];
    
    // Réponse standard de succès
    ResponseHandler::success([
        'items' => $data,
        'count' => count($data),
        'userId' => $userId,
        'deviceId' => $deviceId
    ]);
    
} catch (Exception $e) {
    ResponseHandler::error(
        'Erreur lors du traitement: ' . $e->getMessage(),
        500
    );
}
?>
