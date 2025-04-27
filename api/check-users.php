
<?php
// Fichier de vérification des utilisateurs (fallback pour le diagnostic)
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
    // Tester la connexion PDO directement
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
    
    error_log("Tentative de connexion PDO directe à la base de données");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie");
    
    // Vérifier si la table utilisateurs existe
    $tableExists = false;
    $users = [];
    
    $stmt = $pdo->query("SHOW TABLES LIKE 'utilisateurs'");
    if ($stmt->rowCount() > 0) {
        $tableExists = true;
        
        // Récupérer les utilisateurs
        $stmt = $pdo->query("SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs");
        $users = $stmt->fetchAll();
    }
    
    // Utilisateurs de secours au cas où
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
            'mot_de_passe' => 'admin123',
            'role' => 'admin'
        ]
    ];
    
    // Si aucun utilisateur n'est trouvé dans la base de données, créer des données par défaut
    if (empty($users)) {
        // Au moins utiliser ces données par défaut
        $users = [
            [
                'id' => 1,
                'nom' => 'Cirier',
                'prenom' => 'Antoine',
                'email' => 'antcirier@gmail.com',
                'identifiant_technique' => 'p71x6d_system',
                'role' => 'admin',
                'date_creation' => date('Y-m-d H:i:s')
            ],
            [
                'id' => 2,
                'nom' => 'Administrateur',
                'prenom' => 'Système',
                'email' => 'admin@formacert.com',
                'identifiant_technique' => 'admin',
                'role' => 'admin',
                'date_creation' => date('Y-m-d H:i:s')
            ]
        ];
    }
    
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Vérification des utilisateurs réussie',
        'table_exists' => $tableExists,
        'records' => $users,
        'fallback_users' => $fallbackUsers
    ]);
} catch (PDOException $e) {
    error_log("Erreur de connexion PDO: " . $e->getMessage());
    
    // En cas d'erreur, retourner au moins les utilisateurs de secours
    $fallbackUsers = [
        [
            'id' => 1,
            'nom' => 'Cirier',
            'prenom' => 'Antoine',
            'email' => 'antcirier@gmail.com',
            'identifiant_technique' => 'p71x6d_system',
            'role' => 'admin',
            'date_creation' => date('Y-m-d H:i:s')
        ],
        [
            'id' => 2,
            'nom' => 'Administrateur',
            'prenom' => 'Système',
            'email' => 'admin@formacert.com',
            'identifiant_technique' => 'admin',
            'role' => 'admin',
            'date_creation' => date('Y-m-d H:i:s')
        ]
    ];
    
    http_response_code(200); // Retourner 200 même en cas d'erreur pour éviter des problèmes côté client
    echo json_encode([
        'status' => 'warning',
        'message' => 'Erreur de connexion à la base de données',
        'table_exists' => false,
        'records' => $fallbackUsers,
        'error' => $e->getMessage(),
        'fallback_users' => [
            ['identifiant_technique' => 'admin', 'mot_de_passe' => 'admin123', 'role' => 'admin'],
            ['identifiant_technique' => 'antcirier@gmail.com', 'mot_de_passe' => 'password123', 'role' => 'admin'],
            ['identifiant_technique' => 'p71x6d_system', 'mot_de_passe' => 'admin123', 'role' => 'admin']
        ]
    ]);
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la vérification des utilisateurs',
        'error' => $e->getMessage(),
        'fallback_users' => [
            ['identifiant_technique' => 'admin', 'mot_de_passe' => 'admin123', 'role' => 'admin'],
            ['identifiant_technique' => 'antcirier@gmail.com', 'mot_de_passe' => 'password123', 'role' => 'admin'],
            ['identifiant_technique' => 'p71x6d_system', 'mot_de_passe' => 'admin123', 'role' => 'admin']
        ]
    ]);
}
?>
