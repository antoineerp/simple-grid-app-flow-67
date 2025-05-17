
<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$db_name = "p71x6d_richard";
$username = "p71x6d_richard";
$password = "Trottinette43!";

try {
    // Tenter une connexion PDO
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Vérifier si la table utilisateurs existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
    $tableExists = $stmt->rowCount() > 0;
    
    // Compter le nombre d'utilisateurs si la table existe
    $userCount = 0;
    if ($tableExists) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM utilisateurs");
        $result = $stmt->fetch();
        $userCount = $result['count'];
    }
    
    // Vérifier si une table users existe par erreur
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $usersTableExists = $stmt->rowCount() > 0;
    
    // Obtenir des informations sur le serveur MySQL
    $stmt = $pdo->query("SELECT VERSION() as version");
    $result = $stmt->fetch();
    $mysqlVersion = $result['version'];
    
    echo json_encode([
        "status" => "success",
        "message" => "Connexion à la base de données réussie",
        "database" => [
            "host" => $host,
            "name" => $db_name,
            "user" => $username,
            "version" => $mysqlVersion
        ],
        "tables" => [
            "utilisateurs_exists" => $tableExists,
            "utilisateurs_count" => $userCount,
            "users_exists" => $usersTableExists
        ],
        "timestamp" => date("Y-m-d H:i:s")
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Erreur de connexion à la base de données",
        "error" => $e->getMessage(),
        "timestamp" => date("Y-m-d H:i:s")
    ]);
}
?>
