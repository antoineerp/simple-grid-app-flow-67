
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

// Fonction pour nettoyer les chaînes UTF-8
function cleanUTF8($input) {
    if (is_string($input)) {
        return mb_convert_encoding($input, 'UTF-8', 'UTF-8');
    } elseif (is_array($input)) {
        foreach ($input as $key => $value) {
            $input[$key] = cleanUTF8($value);
        }
    }
    return $input;
}

try {
    // Journaliser l'exécution
    error_log("=== EXÉCUTION DE check-users.php ===");
    error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
    
    // Informations de connexion à la base de données Infomaniak
    $host = 'p71x6d.myd.infomaniak.com';
    $db_name = 'p71x6d_system';
    $username = 'p71x6d_system';
    $password = ''; // À remplir avec le mot de passe réel
    
    try {
        // Tenter de se connecter directement à la base de données
        $db = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
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
                "message" => "Connexion réussie à la base de données Infomaniak",
                "records" => $users,
                "count" => count($users),
                "database_info" => [
                    "connected" => true,
                    "host" => $host,
                    "database" => $db_name,
                    "tables" => ["utilisateurs", "documents", "indicateurs", "qualiopi_criteres", "qualiopi_indicateurs", "ressources_humaines"]
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
                    "host" => $host,
                    "database" => $db_name
                ]
            ];
        }
    } catch (PDOException $e) {
        // En cas d'erreur de connexion
        error_log("Erreur de connexion à la base de données: " . $e->getMessage());
        
        $response = [
            "status" => "error",
            "message" => "Impossible de se connecter à la base de données Infomaniak",
            "error" => $e->getMessage(),
            "records" => [],
            "count" => 0,
            "database_info" => [
                "connected" => false,
                "host" => $host,
                "database" => $db_name,
                "error" => $e->getMessage()
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
