
<?php
// Définir explicitement l'encodage UTF-8
header('Content-Type: application/json; charset=utf-8');

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// CORS - Accepter toutes les origines
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Réponse pour les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['status' => 200, 'message' => 'Preflight OK']));
}

// Créer une réponse simple
$response = [
    'status' => 'success',
    'message' => 'Test JSON fonctionnel',
    'timestamp' => date('Y-m-d H:i:s'),
    'data' => [
        'string_value' => 'Chaîne avec caractères spéciaux: é à ç è ù',
        'number_value' => 123.45,
        'boolean_value' => true,
        'null_value' => null,
        'array_value' => [1, 2, 3, 4, 5]
    ]
];

// Vérifier si on veut tester une erreur JSON
if (isset($_GET['error']) && $_GET['error'] === 'true') {
    // Générer une erreur JSON volontaire
    echo '{malformed: json"data}';
    exit;
}

// Vérifier si on veut tester un contenu HTML
if (isset($_GET['html']) && $_GET['html'] === 'true') {
    // Envoyer du HTML au lieu de JSON pour simuler une erreur serveur
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html><body><h1>Erreur de serveur simulée</h1><p>Ceci est une page HTML au lieu d'une réponse JSON.</p></body></html>';
    exit;
}

// Vérifier si on veut tester une erreur HTTP
if (isset($_GET['http_error']) && is_numeric($_GET['http_error'])) {
    $code = intval($_GET['http_error']);
    if ($code >= 400 && $code < 600) {
        $response['status'] = 'error';
        $response['message'] = "Erreur HTTP $code simulée";
        http_response_code($code);
    }
}

// Écrire la réponse JSON avec des options d'encodage UTF-8
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
?>
