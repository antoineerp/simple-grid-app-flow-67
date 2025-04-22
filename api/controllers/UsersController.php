
<?php
// Inclure les fichiers nécessaires
require_once 'config/database.php';
require_once 'models/User.php';

// Définir les headers pour CORS
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser la requête pour débogage
error_log("UsersController - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Récupérer la méthode HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Créer une instance de Database
    $database = new Database();
    $db = $database->getConnection();

    // Créer une instance de User
    $user = new User($db);

    // Traiter la requête en fonction de la méthode HTTP
    switch ($method) {
        case 'GET':
            // Récupérer tous les utilisateurs
            $stmt = $user->read();
            $num = $stmt->rowCount();
            
            if ($num > 0) {
                $users_arr = array();
                $users_arr["records"] = array();
                
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    extract($row);
                    
                    // Masquer le mot de passe
                    $row['mot_de_passe'] = '******';
                    
                    array_push($users_arr["records"], $row);
                }
                
                http_response_code(200);
                echo json_encode($users_arr);
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Aucun utilisateur trouvé."));
            }
            break;
            
        case 'POST':
            // Créer un utilisateur
            $data = json_decode(file_get_contents("php://input"));
            
            // Journaliser les données reçues
            error_log("UsersController POST - Données reçues: " . json_encode($data));
            
            // Vérifier que les données requises sont présentes
            if (
                !empty($data->nom) &&
                !empty($data->prenom) &&
                !empty($data->email) &&
                !empty($data->identifiant_technique) &&
                !empty($data->mot_de_passe) &&
                !empty($data->role)
            ) {
                try {
                    $user->nom = $data->nom;
                    $user->prenom = $data->prenom;
                    $user->email = $data->email;
                    $user->identifiant_technique = $data->identifiant_technique;
                    $user->mot_de_passe = $data->mot_de_passe;
                    $user->role = $data->role;
                    
                    if ($user->create()) {
                        http_response_code(201);
                        echo json_encode(array("message" => "Utilisateur créé avec succès."));
                    } else {
                        error_log("UsersController POST - Échec de la création: erreur dans user->create()");
                        http_response_code(503);
                        echo json_encode(array("message" => "Impossible de créer l'utilisateur."));
                    }
                } catch (Exception $e) {
                    error_log("UsersController POST - Exception: " . $e->getMessage());
                    http_response_code(500);
                    echo json_encode(array("message" => "Erreur lors de la création de l'utilisateur: " . $e->getMessage()));
                }
            } else {
                error_log("UsersController POST - Données incomplètes: " . json_encode($data));
                http_response_code(400);
                echo json_encode(array("message" => "Impossible de créer l'utilisateur. Les données sont incomplètes."));
            }
            break;
            
        case 'PUT':
            // Mettre à jour un utilisateur
            $data = json_decode(file_get_contents("php://input"));
            
            if (
                !empty($data->id) &&
                !empty($data->nom) &&
                !empty($data->prenom) &&
                !empty($data->email) &&
                !empty($data->role)
            ) {
                try {
                    $user->id = $data->id;
                    $user->nom = $data->nom;
                    $user->prenom = $data->prenom;
                    $user->email = $data->email;
                    $user->role = $data->role;
                    
                    if ($user->update()) {
                        http_response_code(200);
                        echo json_encode(array("message" => "Utilisateur mis à jour avec succès."));
                    } else {
                        http_response_code(503);
                        echo json_encode(array("message" => "Impossible de mettre à jour l'utilisateur."));
                    }
                } catch (Exception $e) {
                    error_log("UsersController PUT - Exception: " . $e->getMessage());
                    http_response_code(500);
                    echo json_encode(array("message" => "Erreur lors de la mise à jour: " . $e->getMessage()));
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Impossible de mettre à jour l'utilisateur. Les données sont incomplètes."));
            }
            break;
            
        case 'DELETE':
            // Supprimer un utilisateur
            $data = json_decode(file_get_contents("php://input"));
            
            if (!empty($data->id)) {
                try {
                    $user->id = $data->id;
                    
                    if ($user->delete()) {
                        http_response_code(200);
                        echo json_encode(array("message" => "Utilisateur supprimé avec succès."));
                    } else {
                        http_response_code(503);
                        echo json_encode(array("message" => "Impossible de supprimer l'utilisateur."));
                    }
                } catch (Exception $e) {
                    error_log("UsersController DELETE - Exception: " . $e->getMessage());
                    http_response_code(500);
                    echo json_encode(array("message" => "Erreur lors de la suppression: " . $e->getMessage()));
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Impossible de supprimer l'utilisateur. ID non fourni."));
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(array("message" => "Méthode non autorisée"));
            break;
    }
} catch (Exception $e) {
    error_log("UsersController - Exception globale: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Erreur serveur: " . $e->getMessage()));
}
?>
