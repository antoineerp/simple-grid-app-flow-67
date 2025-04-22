
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

// Inclure la configuration de la base de données
require_once 'config/database.php';

try {
    // Journaliser l'exécution
    error_log("=== EXÉCUTION DE check-users.php ===");
    error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
    
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
            } else {
                // La table n'existe pas encore
                $response = [
                    "status" => "warning",
                    "message" => "La table 'utilisateurs' n'existe pas encore dans la base de données",
                    "records" => [],
                    "count" => 0,
                    "database_info" => [
                        "connected" => true,
                        "host" => $database->host,
                        "database" => $database->db_name
                    ]
                ];
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
    
    // Ajouter les utilisateurs de secours en cas d'échec de la base de données
    if (!isset($response["records"]) || empty($response["records"])) {
        $response["fallback_users"] = [
            [
                "identifiant_technique" => "p71x6d_system",
                "mot_de_passe" => "admin123",
                "role" => "admin",
                "nom" => "Administrateur",
                "prenom" => "Système",
                "email" => "admin@qualiopi.ch"
            ],
            [
                "identifiant_technique" => "admin",
                "mot_de_passe" => "admin123",
                "role" => "admin",
                "nom" => "Admin",
                "prenom" => "Default",
                "email" => "admin@qualiopi.ch"
            ],
            [
                "identifiant_technique" => "antcirier@gmail.com",
                "mot_de_passe" => "password123",
                "role" => "admin",
                "nom" => "Cirier",
                "prenom" => "Antoine",
                "email" => "antcirier@gmail.com"
            ],
            [
                "identifiant_technique" => "p71x6d_dupont",
                "mot_de_passe" => "manager456",
                "role" => "gestionnaire",
                "nom" => "Dupont",
                "prenom" => "Jean",
                "email" => "jean.dupont@qualiopi.ch"
            ],
            [
                "identifiant_technique" => "p71x6d_martin",
                "mot_de_passe" => "user789",
                "role" => "utilisateur",
                "nom" => "Martin",
                "prenom" => "Sophie",
                "email" => "sophie.martin@qualiopi.ch"
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
        ],
        "fallback_users" => [
            [
                "identifiant_technique" => "p71x6d_system",
                "mot_de_passe" => "admin123",
                "role" => "admin"
            ],
            [
                "identifiant_technique" => "admin",
                "mot_de_passe" => "admin123",
                "role" => "admin"
            ],
            [
                "identifiant_technique" => "antcirier@gmail.com",
                "mot_de_passe" => "password123",
                "role" => "admin"
            ],
            [
                "identifiant_technique" => "p71x6d_dupont",
                "mot_de_passe" => "manager456",
                "role" => "gestionnaire"
            ],
            [
                "identifiant_technique" => "p71x6d_martin",
                "mot_de_passe" => "user789",
                "role" => "utilisateur"
            ]
        ]
    ], JSON_UNESCAPED_UNICODE);
}
?>
