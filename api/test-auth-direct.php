
<?php
// Afficher les erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

echo json_encode([
    'time' => date('Y-m-d H:i:s'),
    'status' => 'running',
    'test' => 'direct-auth-test',
    'env_php_exists' => file_exists(__DIR__ . '/config/env.php'),
    'db_config_exists' => file_exists(__DIR__ . '/config/db_config.json'),
    'server_info' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
    ]
]);

// Essayer de se connecter à la base de données
try {
    $host = 'p71x6d.myd.infomaniak.com';
    $db_name = 'p71x6d_richard';
    $username = 'p71x6d_richard';
    $password = 'Trottinette43!'; 
    
    $pdo = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "\n\nConnexion à la base de données réussie!";
    
    // Vérifier si la table utilisateurs existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
    if ($stmt->rowCount() > 0) {
        echo "\nTable 'utilisateurs' trouvée!";
        // Compter les utilisateurs
        $stmt = $pdo->query("SELECT COUNT(*) FROM utilisateurs");
        $count = $stmt->fetchColumn();
        echo "\nNombre d'utilisateurs: $count";
    } else {
        echo "\nTable 'utilisateurs' non trouvée!";
    }
} catch (PDOException $e) {
    echo "\n\nErreur de connexion: " . $e->getMessage();
}
?>
