
<?php
// Script pour charger les données des membres
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Récupérer les paramètres
$userId = isset($_GET['userId']) ? $_GET['userId'] : null;
$deviceId = isset($_GET['deviceId']) ? $_GET['deviceId'] : null;

// Vérifier que les paramètres nécessaires sont présents
if (!$userId || !$deviceId) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Paramètres manquants: userId et deviceId sont requis',
        'status' => 400
    ]);
    exit;
}

// En production, ces données seraient récupérées depuis une base de données
// Pour l'instant, nous renvoyons des données de test

$membres = [
    [
        'id' => 'membre_test_1',
        'nom' => 'Dupont',
        'prenom' => 'Jean',
        'fonction' => 'Directeur',
        'initiales' => 'JD',
        'email' => 'jean.dupont@example.com',
        'telephone' => '+33 6 12 34 56 78',
        'date_creation' => date('Y-m-d H:i:s', strtotime('-10 days'))
    ],
    [
        'id' => 'membre_test_2',
        'nom' => 'Martin',
        'prenom' => 'Sophie',
        'fonction' => 'Responsable RH',
        'initiales' => 'SM',
        'email' => 'sophie.martin@example.com',
        'telephone' => '+33 6 23 45 67 89',
        'date_creation' => date('Y-m-d H:i:s', strtotime('-5 days'))
    ],
    [
        'id' => 'membre_test_3',
        'nom' => 'Dubois',
        'prenom' => 'Michel',
        'fonction' => 'Responsable Qualité',
        'initiales' => 'MD',
        'email' => 'michel.dubois@example.com',
        'telephone' => '+33 6 34 56 78 90',
        'date_creation' => date('Y-m-d H:i:s', strtotime('-2 days'))
    ]
];

// Enregistrer les informations de chargement (facultatif, pour le suivi)
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$loadInfo = [
    'userId' => $userId,
    'deviceId' => $deviceId,
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR']
];

$filename = $dataDir . '/membres_load_' . $userId . '_' . date('Ymd_His') . '.json';
file_put_contents($filename, json_encode($loadInfo, JSON_PRETTY_PRINT));

// Renvoyer les données
echo json_encode([
    'success' => true,
    'message' => 'Chargement des membres réussi',
    'membres' => $membres,
    'count' => count($membres),
    'userId' => $userId,
    'deviceId' => $deviceId,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
