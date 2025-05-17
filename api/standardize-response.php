
<?php
/**
 * Script pour standardiser toutes les réponses API
 */

// Définition du format standard pour les réponses API
$standard_format = [
    'success' => true, // ou false pour les erreurs
    'message' => 'Description de l\'opération',
    'code' => 200, // ou autre code HTTP
    'timestamp' => date('Y-m-d\TH:i:s\Z'),
    'data' => [] // données spécifiques à l'endpoint
];

echo "Format standard pour les réponses API:\n";
echo json_encode($standard_format, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

echo "\n\nExemple de réponse de succès:\n";
echo json_encode([
    'success' => true,
    'message' => 'Chargement des membres réussi',
    'code' => 200,
    'timestamp' => date('Y-m-d\TH:i:s\Z'),
    'data' => [
        'membres' => [
            [
                'id' => 'membre_1',
                'nom' => 'Dupont',
                'prenom' => 'Jean'
            ],
            [
                'id' => 'membre_2',
                'nom' => 'Martin',
                'prenom' => 'Sophie'
            ]
        ],
        'count' => 2,
        'userId' => 'user_123',
        'deviceId' => 'device_456'
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

echo "\n\nExemple de réponse d'erreur:\n";
echo json_encode([
    'success' => false,
    'message' => 'Paramètres manquants',
    'code' => 400,
    'timestamp' => date('Y-m-d\TH:i:s\Z'),
    'data' => [
        'missing' => ['userId', 'deviceId']
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

echo "\n\nDocumentation sur les codes HTTP courants:\n";
$http_codes = [
    200 => 'OK - La requête a réussi',
    201 => 'Created - La ressource a été créée avec succès',
    400 => 'Bad Request - La requête est mal formée',
    401 => 'Unauthorized - Authentification nécessaire',
    403 => 'Forbidden - Accès refusé',
    404 => 'Not Found - Ressource non trouvée',
    409 => 'Conflict - Conflit avec l\'état actuel de la ressource',
    500 => 'Internal Server Error - Erreur interne du serveur'
];

foreach ($http_codes as $code => $description) {
    echo "$code: $description\n";
}
?>
