
<?php
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");

// Activer la journalisation des erreurs
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Informations de connexion Infomaniak en dur
$host = 'p71x6d.myd.infomaniak.com';
$db_name = 'p71x6d_richard';
$username = 'p71x6d_richard';
$password = 'Trottinette43!';

$response = [
    'success' => false,
    'message' => 'Connexion non testée',
    'details' => []
];

try {
    // Afficher les informations de connexion (masquer le mot de passe)
    $response['details']['connection_info'] = [
        'host' => $host,
        'db_name' => $db_name,
        'username' => $username,
        'password' => '********'
    ];
    
    // Tester la connexion directe avec PDO
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $start = microtime(true);
    $pdo = new PDO($dsn, $username, $password, $options);
    $end = microtime(true);
    
    // Tester une requête simple
    $stmt = $pdo->query("SELECT NOW() as time, VERSION() as version");
    $result = $stmt->fetch();
    
    // Tester si la table utilisateurs existe
    $tables_stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
    $table_exists = $tables_stmt->rowCount() > 0;
    
    // Compter les utilisateurs si la table existe
    $user_count = 0;
    if ($table_exists) {
        $count_stmt = $pdo->query("SELECT COUNT(*) as total FROM utilisateurs");
        $count_result = $count_stmt->fetch();
        $user_count = $count_result['total'];
    }
    
    $response['success'] = true;
    $response['message'] = 'Connexion à la base de données réussie';
    $response['details'] = array_merge($response['details'], [
        'connection_time_ms' => round(($end - $start) * 1000, 2),
        'server_time' => $result['time'],
        'server_version' => $result['version'],
        'tables' => [
            'utilisateurs_exists' => $table_exists,
            'utilisateurs_count' => $user_count
        ]
    ]);
    
} catch (PDOException $e) {
    $response['success'] = false;
    $response['message'] = 'Erreur de connexion à la base de données';
    $response['details']['error'] = $e->getMessage();
    
    // Journaliser l'erreur
    error_log("Erreur de connexion à la base de données: " . $e->getMessage());
}

// Afficher la réponse au format JSON
echo json_encode($response, JSON_PRETTY_PRINT);
?>
