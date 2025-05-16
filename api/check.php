
<?php
// Activer la journalisation d'erreurs pour le débogage
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Définir explicitement le type de contenu JSON et les en-têtes CORS
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), terminer ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Informations sur le serveur
$server_info = [
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
    'php_version' => phpversion(),
    'system' => php_uname(),
    'time' => date('Y-m-d H:i:s'),
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Inconnu',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Inconnu',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Inconnu',
    'http_user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Inconnu'
];

// Tester la connexion à la base de données
$db_status = [];
try {
    // Informations de connexion Infomaniak
    $host = 'p71x6d.myd.infomaniak.com';
    $db_name = 'p71x6d_richard';
    $username = 'p71x6d_richard';
    $password = 'Trottinette43!';
    
    // Tenter une connexion à la base de données
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Tester la connexion avec une requête simple
    $stmt = $pdo->query("SELECT COUNT(*) FROM utilisateurs");
    $count = $stmt->fetchColumn();
    
    $db_status = [
        'connected' => true,
        'server_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
        'driver_name' => $pdo->getAttribute(PDO::ATTR_DRIVER_NAME),
        'user_count' => $count
    ];
} catch (PDOException $e) {
    $db_status = [
        'connected' => false,
        'error' => $e->getMessage()
    ];
} catch (Exception $e) {
    $db_status = [
        'connected' => false,
        'error' => $e->getMessage()
    ];
}

// Créer la réponse
$response = [
    'success' => true,
    'message' => 'API accessible',
    'server_info' => $server_info,
    'db_status' => $db_status
];

// Envoyer la réponse JSON
echo json_encode($response);
?>
