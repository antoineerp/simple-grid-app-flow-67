
<?php
// Définir les en-têtes pour empêcher la mise en cache et autoriser CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation pour débogage
error_log("=== EXÉCUTION DE check-users.php ===");

try {
    // Paramètres de connexion directe à la base de données Infomaniak
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    error_log("Tentative de connexion directe à la base de données Infomaniak");
    
    // Connexion directe à la base de données
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion à la base de données réussie");
    
    // Vérifier si la table utilisateurs existe
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
    
    $response = [
        "status" => "success",
        "message" => "Connexion à la base de données réussie",
        "tables" => $tables,
        "timestamp" => date('Y-m-d H:i:s')
    ];
    
    // Si la table utilisateurs existe, récupérer les utilisateurs
    if (in_array('utilisateurs', $tables)) {
        error_log("Table utilisateurs trouvée, récupération des utilisateurs");
        
        $stmt = $pdo->query("SELECT * FROM utilisateurs LIMIT 10");
        $users = $stmt->fetchAll();
        
        // Vérifier si antcirier@gmail.com existe et ajouter des informations de débogage
        $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ?");
        $stmt->execute(["antcirier@gmail.com"]);
        $antcirier = $stmt->fetch();
        
        if ($antcirier) {
            error_log("Utilisateur antcirier@gmail.com trouvé: " . json_encode($antcirier));
            $response["antcirier_exists"] = true;
            $response["antcirier_data"] = [
                "id" => $antcirier["id"],
                "email" => $antcirier["email"],
                "role" => $antcirier["role"],
                "identifiant_technique" => $antcirier["identifiant_technique"],
                "mot_de_passe_length" => strlen($antcirier["mot_de_passe"]),
                "mot_de_passe_start" => substr($antcirier["mot_de_passe"], 0, 10) . "..."
            ];
        } else {
            error_log("Utilisateur antcirier@gmail.com non trouvé");
            $response["antcirier_exists"] = false;
        }
        
        // Compter le nombre d'utilisateurs
        $stmt = $pdo->query("SELECT COUNT(*) FROM utilisateurs");
        $count = $stmt->fetchColumn();
        
        $response["utilisateurs_count"] = $count;
        $response["utilisateurs_sample"] = $users;
    } else {
        error_log("Table utilisateurs non trouvée, création de la table");
        
        // Créer la table utilisateurs si elle n'existe pas
        $pdo->exec("CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100),
            prenom VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            mot_de_passe VARCHAR(255),
            identifiant_technique VARCHAR(100) UNIQUE,
            role VARCHAR(50),
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        
        // Ajouter un utilisateur administrateur antcirier@gmail.com
        $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                               VALUES (?, ?, ?, ?, ?, ?) 
                               ON DUPLICATE KEY UPDATE mot_de_passe = ?");
        
        $admin_password = password_hash("password123", PASSWORD_DEFAULT);
        $stmt->execute([
            "Cirier", 
            "Antoine", 
            "antcirier@gmail.com", 
            $admin_password, 
            "antcirier", 
            "admin",
            $admin_password
        ]);
        
        error_log("Utilisateur administrateur créé ou mis à jour");
        
        // Ajouter également un utilisateur p71x6d_system
        $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                               VALUES (?, ?, ?, ?, ?, ?)
                               ON DUPLICATE KEY UPDATE mot_de_passe = ?");
        
        $system_password = password_hash("Trottinette43!", PASSWORD_DEFAULT);
        $stmt->execute([
            "System", 
            "Admin", 
            "system@qualiopi.ch", 
            $system_password, 
            "p71x6d_system", 
            "admin",
            $system_password
        ]);
        
        error_log("Utilisateur système créé ou mis à jour");
        
        // Récupérer les utilisateurs après création
        $stmt = $pdo->query("SELECT * FROM utilisateurs");
        $users = $stmt->fetchAll();
        
        $response["table_created"] = true;
        $response["utilisateurs_count"] = count($users);
        $response["utilisateurs_sample"] = $users;
    }
    
    // Ajouter des utilisateurs de secours pour la connexion
    $response["fallback_users"] = [
        [
            "identifiant_technique" => "antcirier@gmail.com",
            "mot_de_passe" => "password123",
            "role" => "admin"
        ],
        [
            "identifiant_technique" => "p71x6d_system",
            "mot_de_passe" => "Trottinette43!",
            "role" => "admin"
        ]
    ];
    
    // Renvoyer la réponse en format JSON
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage());
    
    echo json_encode([
        "status" => "error",
        "message" => "Erreur de connexion à la base de données",
        "error" => $e->getMessage(),
        "fallback_users" => [
            [
                "identifiant_technique" => "antcirier@gmail.com",
                "mot_de_passe" => "password123",
                "role" => "admin"
            ],
            [
                "identifiant_technique" => "p71x6d_system",
                "mot_de_passe" => "Trottinette43!",
                "role" => "admin"
            ]
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    
    echo json_encode([
        "status" => "error",
        "message" => "Erreur générale",
        "error" => $e->getMessage()
    ]);
}

error_log("=== FIN DE L'EXÉCUTION DE check-users.php ===");
?>
