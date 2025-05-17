
<?php
/**
 * API de synchronisation des membres
 * Format standardisé pour toutes les API de l'application
 */

// En-têtes communs pour tous les endpoints API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-ID');

// Inclure la classe ResponseHandler
require_once __DIR__ . '/utils/ResponseHandler.php';

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier que la méthode HTTP est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ResponseHandler::error(
        "Méthode non autorisée. Utilisez POST.",
        405
    );
}

// Lire les données JSON envoyées
$inputData = file_get_contents('php://input');
$data = json_decode($inputData, true);

// Vérifier si les données JSON sont valides
if (json_last_error() !== JSON_ERROR_NONE) {
    ResponseHandler::error(
        'Données JSON invalides: ' . json_last_error_msg(),
        400
    );
}

// Vérifier si les données nécessaires sont présentes
if (!isset($data['userId']) || !isset($data['deviceId']) || !isset($data['membres'])) {
    ResponseHandler::error(
        'Données incomplètes. userId, deviceId et membres sont requis.',
        400,
        ['received' => array_keys($data)]
    );
}

try {
    // Traitement de la synchronisation (simulé)
    $userId = $data['userId'];
    $deviceId = $data['deviceId'];
    $membres = $data['membres'];

    // Créer le dossier data s'il n'existe pas
    $dataDir = __DIR__ . '/data';
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }

    // Enregistrer la synchronisation dans un fichier JSON
    $syncData = [
        'userId' => $userId,
        'deviceId' => $deviceId,
        'membres' => $membres,
        'timestamp' => date('Y-m-d\TH:i:s\Z')
    ];

    $filename = $dataDir . '/membres_sync_' . $userId . '_' . date('Ymd_His') . '.json';
    file_put_contents($filename, json_encode($syncData, JSON_PRETTY_PRINT));

    // Réponse standard de succès
    ResponseHandler::success([
        'sync_id' => basename($filename, '.json'),
        'records_count' => count($membres),
        'userId' => $userId,
        'deviceId' => $deviceId
    ], 200, 'Synchronisation des membres réussie');
    
} catch (Exception $e) {
    ResponseHandler::error(
        'Erreur lors de la synchronisation des membres: ' . $e->getMessage(),
        500
    );
}
?>
