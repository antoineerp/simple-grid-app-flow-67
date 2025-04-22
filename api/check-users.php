
<?php
// Définir explicitement l'encodage UTF-8
header('Content-Type: application/json; charset=utf-8');

// Désactiver la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// CORS - Accepter toutes les origines
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(json_encode(['status' => 200, 'message' => 'Preflight OK']));
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE check-users.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Inclure la configuration de la base de données
require_once 'config/database.php';

try {
    // Créer une instance de la base de données
    $database = new Database();
    $db = $database->getConnection(false);
    
    // Vérifier si nous sommes connectés à la base de données
    if ($database->is_connected) {
        try {
            // Vérifier si la table utilisateurs existe
            $stmt = $db->query("SHOW TABLES LIKE 'utilisateurs'");
            $tableExists = $stmt->rowCount() > 0;
            
            if ($tableExists) {
                // Lire les utilisateurs
                $query = "SELECT * FROM utilisateurs";
                $stmt = $db->query($query);
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Masquer les mots de passe
                foreach ($users as &$user) {
                    if (isset($user['mot_de_passe'])) {
                        $user['mot_de_passe'] = '******';
                    }
                }
                
                // Construire la réponse
                $response = [
                    "status" => "success",
                    "message" => "Connexion réussie à la base de données",
                    "records" => $users,
                    "count" => count($users),
                    "database_info" => [
                        "connected" => true,
                        "host" => $database->host,
                        "database" => $database->db_name,
                        "tables" => ["utilisateurs"]
                    ]
                ];
                
                error_log("Utilisateurs récupérés avec succès. Nombre: " . count($users));
            } else {
                error_log("La table 'utilisateurs' n'existe pas dans la base de données");
                
                // Créer la table utilisateurs si elle n'existe pas
                try {
                    $createTableQuery = "CREATE TABLE IF NOT EXISTS `utilisateurs` (
                        `id` int(11) NOT NULL AUTO_INCREMENT,
                        `nom` varchar(100) NOT NULL,
                        `prenom` varchar(100) NOT NULL,
                        `email` varchar(255) NOT NULL,
                        `mot_de_passe` varchar(255) NOT NULL,
                        `identifiant_technique` varchar(50) NOT NULL,
                        `role` varchar(20) NOT NULL,
                        `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (`id`),
                        UNIQUE KEY `email` (`email`),
                        UNIQUE KEY `identifiant_technique` (`identifiant_technique`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;";
                    
                    $db->exec($createTableQuery);
                    error_log("Table 'utilisateurs' créée avec succès");
                    
                    // Insertion d'un utilisateur administrateur par défaut
                    $insertAdminQuery = "INSERT INTO `utilisateurs` 
                        (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`) VALUES
                        ('Admin', 'Système', 'admin@qualiopi.ch', '" . password_hash('admin123', PASSWORD_DEFAULT) . "', 'p71x6d_system', 'admin');";
                    
                    $db->exec($insertAdminQuery);
                    error_log("Utilisateur administrateur créé par défaut");
                    
                    // La table a été créée, mais elle est encore vide (à part l'admin)
                    $response = [
                        "status" => "success",
                        "message" => "Table 'utilisateurs' créée avec succès",
                        "records" => [
                            [
                                "id" => 1,
                                "nom" => "Admin",
                                "prenom" => "Système",
                                "email" => "admin@qualiopi.ch",
                                "mot_de_passe" => "******",
                                "identifiant_technique" => "p71x6d_system",
                                "role" => "admin",
                                "date_creation" => date("Y-m-d H:i:s")
                            ]
                        ],
                        "count" => 1,
                        "database_info" => [
                            "connected" => true,
                            "host" => $database->host,
                            "database" => $database->db_name,
                            "tables" => ["utilisateurs"],
                            "table_created" => true
                        ]
                    ];
                } catch (PDOException $e) {
                    error_log("Erreur lors de la création de la table 'utilisateurs': " . $e->getMessage());
                    
                    // La table n'existe pas encore et n'a pas pu être créée
                    $response = [
                        "status" => "warning",
                        "message" => "La table 'utilisateurs' n'existe pas et n'a pas pu être créée: " . $e->getMessage(),
                        "records" => [],
                        "count" => 0,
                        "database_info" => [
                            "connected" => true,
                            "host" => $database->host,
                            "database" => $database->db_name,
                            "error" => $e->getMessage()
                        ]
                    ];
                }
            }
        } catch (PDOException $e) {
            // Erreur lors de la requête SQL
            error_log("Erreur SQL dans check-users.php: " . $e->getMessage());
            
            $response = [
                "status" => "error",
                "message" => "Erreur lors de la requête SQL",
                "error" => $e->getMessage(),
                "records" => [],
                "count" => 0,
                "database_info" => [
                    "connected" => true,
                    "host" => $database->host,
                    "database" => $database->db_name,
                    "error" => $e->getMessage()
                ]
            ];
        }
    } else {
        // Non connecté à la base de données
        error_log("Non connecté à la base de données: " . $database->connection_error);
        
        $response = [
            "status" => "error",
            "message" => "Non connecté à la base de données",
            "error" => $database->connection_error,
            "records" => [],
            "count" => 0,
            "database_info" => [
                "connected" => false,
                "host" => $database->host,
                "database" => $database->db_name,
                "error" => $database->connection_error
            ]
        ];
    }
    
    // Envoyer la réponse
    http_response_code(200);
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Journaliser l'erreur
    error_log("Erreur dans check-users.php: " . $e->getMessage());
    
    // Définir le code de réponse à 500 (erreur interne du serveur)
    http_response_code(500);
    
    // Informer l'utilisateur
    echo json_encode([
        "status" => "error",
        "message" => "Une erreur est survenue lors de la récupération des utilisateurs",
        "error" => $e->getMessage(),
        "database_info" => [
            "connected" => false,
            "error" => $e->getMessage()
        ]
    ], JSON_UNESCAPED_UNICODE);
}
?>
