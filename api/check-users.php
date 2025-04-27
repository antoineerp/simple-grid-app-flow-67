
<?php
// Fichier de vérification des utilisateurs
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

// Journaliser l'exécution
error_log("=== EXÉCUTION DE check-users.php ===");

try {
    // Connexion à la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion à la base de données");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion réussie");
    
    // Vérifier si la table utilisateurs existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
    $tableExists = $stmt->rowCount() > 0;
    
    $users = [];
    
    if ($tableExists) {
        // Récupération des utilisateurs
        $stmt = $pdo->query("SELECT * FROM utilisateurs");
        $users = $stmt->fetchAll();
        
        // Masquer les mots de passe
        foreach ($users as &$user) {
            if (isset($user['mot_de_passe'])) {
                $user['mot_de_passe'] = '********';
            }
        }
    }
    
    // Utilisateurs de secours pour les tests
    $fallbackUsers = [
        [
            'identifiant_technique' => 'admin',
            'mot_de_passe' => 'admin123',
            'role' => 'admin'
        ],
        [
            'identifiant_technique' => 'antcirier@gmail.com',
            'mot_de_passe' => 'password123',
            'role' => 'admin'
        ],
        [
            'identifiant_technique' => 'p71x6d_system',
            'mot_de_passe' => 'Trottinette43!',
            'role' => 'admin'
        ]
    ];
    
    // Préparer la réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Vérification des utilisateurs réussie',
        'table_exists' => $tableExists,
        'records' => $users,
        'fallback_users' => $fallbackUsers
    ]);
    exit;
} catch (PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage());
    
    // Renvoyer des utilisateurs de secours en cas d'erreur
    $fallbackUsers = [
        [
            'identifiant_technique' => 'admin',
            'mot_de_passe' => 'admin123',
            'role' => 'admin'
        ],
        [
            'identifiant_technique' => 'antcirier@gmail.com',
            'mot_de_passe' => 'password123',
            'role' => 'admin'
        ],
        [
            'identifiant_technique' => 'p71x6d_system',
            'mot_de_passe' => 'Trottinette43!',
            'role' => 'admin'
        ]
    ];
    
    http_response_code(200); // Succès même en cas d'erreur
    echo json_encode([
        'status' => 'warning',
        'message' => 'Erreur de connexion à la base de données',
        'error' => $e->getMessage(),
        'fallback_users' => $fallbackUsers
    ]);
    exit;
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    
    // Renvoyer des utilisateurs de secours en cas d'erreur
    $fallbackUsers = [
        [
            'identifiant_technique' => 'admin',
            'mot_de_passe' => 'admin123',
            'role' => 'admin'
        ],
        [
            'identifiant_technique' => 'antcirier@gmail.com',
            'mot_de_passe' => 'password123',
            'role' => 'admin'
        ],
        [
            'identifiant_technique' => 'p71x6d_system',
            'mot_de_passe' => 'Trottinette43!',
            'role' => 'admin'
        ]
    ];
    
    http_response_code(200); // Succès même en cas d'erreur
    echo json_encode([
        'status' => 'warning',
        'message' => 'Erreur lors de la vérification des utilisateurs',
        'error' => $e->getMessage(),
        'fallback_users' => $fallbackUsers
    ]);
    exit;
}
?>
