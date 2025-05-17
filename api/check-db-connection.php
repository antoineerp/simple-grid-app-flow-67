
<?php
// Script simple pour vérifier la connexion à la base de données
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Vérifier si la requête est OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Charger les variables d'environnement
$envFile = __DIR__ . '/config/env.php';
if (!file_exists($envFile)) {
    echo json_encode([
        'success' => false,
        'message' => 'Le fichier de configuration env.php est introuvable'
    ]);
    exit;
}
require_once $envFile;

// Tester la connexion à la base de données
$result = [
    'success' => false,
    'db_config' => [
        'host' => DB_HOST,
        'database' => DB_NAME,
        'user' => DB_USER,
        // Ne pas afficher le mot de passe pour des raisons de sécurité
    ]
];

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
        DB_USER,
        DB_PASS
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Vérifier la connexion avec une requête simple
    $stmt = $pdo->query("SELECT 1");
    $stmt->fetchColumn();
    
    $result['success'] = true;
    $result['message'] = 'Connexion à la base de données réussie.';
    
} catch (PDOException $e) {
    $result['message'] = 'Erreur de connexion à la base de données: ' . $e->getMessage();
    $result['error'] = $e->getMessage();
}

echo json_encode($result);
?>
