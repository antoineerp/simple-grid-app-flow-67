
<?php
// Fichier simplifié pour obtenir les infos de la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Paramètres de connexion directs
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    // Tester la connexion simple sans query complexe
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    // Tenter la connexion
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Si on arrive ici, la connexion est réussie
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion à la base de données réussie',
        'database_info' => [
            'host' => $host,
            'database' => $dbname,
            'connected' => true,
            'username' => $username
        ]
    ]);
    
} catch (PDOException $e) {
    // En cas d'erreur de connexion
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    // Erreur générale
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de la base de données',
        'error' => $e->getMessage()
    ]);
}
?>
