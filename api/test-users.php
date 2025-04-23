
<?php
// Script simplifié pour tester l'authentification avec des utilisateurs prédéfinis
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Liste des utilisateurs de test
$test_users = [
    'admin' => ['password' => 'admin123', 'role' => 'admin'],
    'p71x6d_system' => ['password' => 'Trottinette43!', 'role' => 'admin'],
    'antcirier@gmail.com' => ['password' => 'password123', 'role' => 'admin'],
    'p71x6d_dupont' => ['password' => 'manager456', 'role' => 'gestionnaire'],
    'p71x6d_martin' => ['password' => 'user789', 'role' => 'utilisateur']
];

// Masquer les mots de passe pour l'affichage
$display_users = [];
foreach ($test_users as $username => $details) {
    $display_users[$username] = [
        'role' => $details['role'],
        'password' => '********'
    ];
}

// Renvoyer la liste des utilisateurs disponibles
echo json_encode([
    'status' => 'success',
    'message' => 'Utilisateurs de test disponibles',
    'users' => $display_users,
    'note' => 'Utilisez ces utilisateurs pour tester l\'authentification avec login-test.php',
    'php_info' => [
        'version' => phpversion(),
        'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
    ]
]);
?>
