
<?php
// Script pour synchroniser les membres
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier si la méthode est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée. Utilisez POST.',
        'status' => 405
    ]);
    exit;
}

// Lire les données JSON envoyées
$inputData = file_get_contents('php://input');
$data = json_decode($inputData, true);

// Vérifier si les données JSON sont valides
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Données JSON invalides: ' . json_last_error_msg(),
        'status' => 400
    ]);
    exit;
}

// Vérifier si les données nécessaires sont présentes
if (!isset($data['userId']) || !isset($data['deviceId']) || !isset($data['membres'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Données incomplètes. userId, deviceId et membres sont requis.',
        'status' => 400,
        'received' => array_keys($data)
    ]);
    exit;
}

// Traitement de la synchronisation (simulé pour le moment)
// En production, ces données seraient sauvegardées dans une base de données

// Créer le dossier data s'il n'existe pas
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Enregistrer la synchronisation dans un fichier JSON
$syncData = [
    'userId' => $data['userId'],
    'deviceId' => $data['deviceId'],
    'membres' => $data['membres'],
    'timestamp' => date('Y-m-d H:i:s')
];

$filename = $dataDir . '/membres_sync_' . $data['userId'] . '_' . date('Ymd_His') . '.json';
file_put_contents($filename, json_encode($syncData, JSON_PRETTY_PRINT));

// Répondre avec succès
echo json_encode([
    'success' => true,
    'message' => 'Synchronisation des membres réussie',
    'status' => 200,
    'sync_id' => basename($filename, '.json')
]);
?>
