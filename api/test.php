
<?php
// Configuration des en-têtes CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Vérifier s'il y a un paramètre action
if (isset($_GET['action']) && $_GET['action'] === 'users') {
    // Si l'action est users, on renvoie la liste des utilisateurs
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";

    try {
        // Connexion à la base de données
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, $username, $password, $options);
        
        // Récupérer tous les utilisateurs
        $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Liste des utilisateurs récupérée avec succès',
            'records' => $users,
            'count' => count($users)
        ]);
        exit;
    } catch (PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Erreur lors de la récupération des utilisateurs: ' . $e->getMessage()
        ]);
        exit;
    }
} else {
    // Sinon on renvoie une réponse simple pour tester la connectivité API
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion API établie',
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => phpversion(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu'
        ]
    ]);
}
?>
