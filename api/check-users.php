
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
    // Inclure les fichiers de configuration et les modèles
    require_once 'config/database.php';
    require_once 'models/User.php';
    
    // Créer une connexion à la base de données
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$database->is_connected) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Créer un objet User
    $user = new User($db);
    
    // Lire tous les utilisateurs
    $stmt = $user->read();
    $num = $stmt->rowCount();
    
    // Vérifier si des utilisateurs ont été trouvés
    if ($num > 0) {
        // Tableau des utilisateurs
        $users_arr = array();
        $users_arr["records"] = array();
        
        // Récupérer les données
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Masquer le mot de passe
            $row['mot_de_passe'] = '******';
            
            // Ajouter l'utilisateur au tableau
            array_push($users_arr["records"], $row);
        }
        
        // Ajouter des informations supplémentaires
        $users_arr["count"] = $num;
        $users_arr["status"] = "success";
        $users_arr["message"] = "Utilisateurs récupérés avec succès";
        $users_arr["database_info"] = array(
            "connected" => true,
            "host" => $database->host,
            "database" => $database->db_name
        );
        
        // Ajouter des identifiants de secours
        $users_arr["fallback_users"] = array(
            array(
                "identifiant_technique" => "admin",
                "mot_de_passe" => "admin123",
                "role" => "admin"
            ),
            array(
                "identifiant_technique" => "antcirier@gmail.com",
                "mot_de_passe" => "password123",
                "role" => "admin"
            ),
            array(
                "identifiant_technique" => "p71x6d_system",
                "mot_de_passe" => "admin123",
                "role" => "admin"
            ),
            array(
                "identifiant_technique" => "p71x6d_dupont",
                "mot_de_passe" => "manager456",
                "role" => "gestionnaire"
            ),
            array(
                "identifiant_technique" => "p71x6d_martin",
                "mot_de_passe" => "user789",
                "role" => "utilisateur"
            )
        );
        
        // Définir le code de réponse à 200 OK
        http_response_code(200);
        
        // Renvoyer les données au format JSON
        echo json_encode($users_arr);
    } else {
        // Aucun utilisateur trouvé
        http_response_code(200);
        
        // Informer l'utilisateur
        echo json_encode(array(
            "status" => "warning",
            "message" => "Aucun utilisateur trouvé",
            "records" => array(),
            "count" => 0,
            "database_info" => array(
                "connected" => true,
                "host" => $database->host,
                "database" => $database->db_name
            ),
            "fallback_users" => array(
                array(
                    "identifiant_technique" => "admin",
                    "mot_de_passe" => "admin123",
                    "role" => "admin"
                ),
                array(
                    "identifiant_technique" => "antcirier@gmail.com",
                    "mot_de_passe" => "password123",
                    "role" => "admin"
                ),
                array(
                    "identifiant_technique" => "p71x6d_system",
                    "mot_de_passe" => "admin123",
                    "role" => "admin"
                ),
                array(
                    "identifiant_technique" => "p71x6d_dupont",
                    "mot_de_passe" => "manager456",
                    "role" => "gestionnaire"
                ),
                array(
                    "identifiant_technique" => "p71x6d_martin",
                    "mot_de_passe" => "user789",
                    "role" => "utilisateur"
                )
            )
        ));
    }
} catch (Exception $e) {
    // Journaliser l'erreur
    error_log("Erreur dans check-users.php: " . $e->getMessage());
    
    // Définir le code de réponse à 500 (erreur interne du serveur)
    http_response_code(500);
    
    // Informer l'utilisateur
    echo json_encode(array(
        "status" => "error",
        "message" => "Une erreur est survenue lors de la récupération des utilisateurs",
        "error" => $e->getMessage(),
        "database_info" => array(
            "connected" => false
        ),
        "fallback_users" => array(
            array(
                "identifiant_technique" => "admin",
                "mot_de_passe" => "admin123",
                "role" => "admin"
            ),
            array(
                "identifiant_technique" => "antcirier@gmail.com",
                "mot_de_passe" => "password123",
                "role" => "admin"
            ),
            array(
                "identifiant_technique" => "p71x6d_system",
                "mot_de_passe" => "admin123",
                "role" => "admin"
            ),
            array(
                "identifiant_technique" => "p71x6d_dupont",
                "mot_de_passe" => "manager456",
                "role" => "gestionnaire"
            ),
            array(
                "identifiant_technique" => "p71x6d_martin",
                "mot_de_passe" => "user789",
                "role" => "utilisateur"
            )
        )
    ));
}
?>
