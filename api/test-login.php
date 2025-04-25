
<?php
// Définir les en-têtes pour permettre le CORS et spécifier que la réponse est en JSON
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Pour les requêtes GET, renvoyer un message de test
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'success',
        'message' => 'Le test de connexion à l\'API fonctionne correctement',
        'time' => date('Y-m-d H:i:s'),
        'method' => $_SERVER['REQUEST_METHOD']
    ]);
    exit;
}

// Pour les requêtes POST, simuler une tentative de connexion
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Récupérer les données POST
    $json_input = file_get_contents("php://input");
    $data = json_decode($json_input);
    
    // Si les données sont valides
    if (isset($data->username) && isset($data->password)) {
        // Utilisateurs de test
        $test_users = [
            'admin' => 'admin123',
            'p71x6d_system' => 'Trottinette43!',
            'antcirier@gmail.com' => 'password123'
        ];
        
        // Vérifier si l'utilisateur existe et si le mot de passe correspond
        if (isset($test_users[$data->username]) && ($test_users[$data->username] === $data->password || 
           ($data->username === 'antcirier@gmail.com' && $data->password === 'Password123!'))) {
            
            // Authentification réussie
            echo json_encode([
                'status' => 'success',
                'message' => 'Authentification réussie',
                'token' => 'test_token_' . time(),
                'user' => [
                    'id' => 1,
                    'nom' => 'Test',
                    'prenom' => 'Utilisateur',
                    'email' => $data->username,
                    'identifiant_technique' => $data->username,
                    'role' => 'admin'
                ]
            ]);
        } else {
            // Authentification échouée
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'message' => 'Identifiants incorrects',
                'username' => $data->username
            ]);
        }
    } else {
        // Données manquantes
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Données manquantes (username et/ou password)'
        ]);
    }
    exit;
}

// Pour toute autre méthode, renvoyer une erreur
http_response_code(405);
echo json_encode([
    'status' => 'error',
    'message' => 'Méthode non autorisée',
    'method' => $_SERVER['REQUEST_METHOD']
]);
?>
