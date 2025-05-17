
<?php
/**
 * API de chargement des membres
 * Format standardisé pour toutes les API de l'application
 */

// En-têtes communs pour tous les endpoints API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-ID');

// Inclure la classe ResponseHandler
require_once __DIR__ . '/utils/ResponseHandler.php';

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier que la méthode HTTP est GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ResponseHandler::error(
        "Méthode non autorisée. Utilisez GET.",
        405
    );
}

// Récupérer et valider les paramètres
$userId = $_GET['userId'] ?? null;
$deviceId = $_GET['deviceId'] ?? null;

if (!$userId || !$deviceId) {
    ResponseHandler::error(
        'Paramètres manquants. userId et deviceId sont requis.',
        400
    );
}

try {
    // Données de test pour les membres
    $membres = [
        [
            'id' => 'membre_test_1',
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'fonction' => 'Directeur',
            'initiales' => 'JD',
            'email' => 'jean.dupont@example.com',
            'telephone' => '+33 6 12 34 56 78',
            'date_creation' => date('Y-m-d\TH:i:s\Z', strtotime('-10 days'))
        ],
        [
            'id' => 'membre_test_2',
            'nom' => 'Martin',
            'prenom' => 'Sophie',
            'fonction' => 'Responsable RH',
            'initiales' => 'SM',
            'email' => 'sophie.martin@example.com',
            'telephone' => '+33 6 23 45 67 89',
            'date_creation' => date('Y-m-d\TH:i:s\Z', strtotime('-5 days'))
        ],
        [
            'id' => 'membre_test_3',
            'nom' => 'Dubois',
            'prenom' => 'Michel',
            'fonction' => 'Responsable Qualité',
            'initiales' => 'MD',
            'email' => 'michel.dubois@example.com',
            'telephone' => '+33 6 34 56 78 90',
            'date_creation' => date('Y-m-d\TH:i:s\Z', strtotime('-2 days'))
        ]
    ];
    
    // Réponse standard de succès
    ResponseHandler::success([
        'membres' => $membres,
        'count' => count($membres),
        'userId' => $userId,
        'deviceId' => $deviceId
    ]);
    
} catch (Exception $e) {
    ResponseHandler::error(
        'Erreur lors du chargement des membres: ' . $e->getMessage(),
        500
    );
}
?>
