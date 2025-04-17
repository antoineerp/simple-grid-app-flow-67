
<?php
// Headers requis
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit;
}

// Inclusion des fichiers nécessaires
include_once '../config/database.php';
include_once '../models/User.php';
include_once '../middleware/Auth.php';

// Récupérer les en-têtes pour l'authentification
$allHeaders = apache_request_headers();
$auth = new Auth($allHeaders);

// Vérifier si l'utilisateur est authentifié
$userData = $auth->isAuth();

// Si l'utilisateur n'est pas authentifié
if (!$userData) {
    http_response_code(401);
    echo json_encode(["message" => "Accès non autorisé"]);
    exit;
}

// Base de données et connexion
$database = new Database();
$db = $database->getConnection();

// Instancier l'utilisateur
$user = new User($db);

// Détermininer la méthode de requête
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Vérifier si l'utilisateur est administrateur
        if ($userData['data']['role'] !== 'administrateur' && $userData['data']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Permission refusée"]);
            exit;
        }
        
        // Lire les utilisateurs
        $stmt = $user->read();
        $num = $stmt->rowCount();
        
        if($num > 0) {
            $users_arr = array();
            $users_arr["records"] = array();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                extract($row);
                
                $user_item = array(
                    "id" => $id,
                    "nom" => $nom,
                    "prenom" => $prenom,
                    "email" => $email,
                    "identifiant_technique" => $identifiant_technique,
                    "role" => $role,
                    "date_creation" => $date_creation
                );
                
                array_push($users_arr["records"], $user_item);
            }
            
            http_response_code(200);
            echo json_encode($users_arr);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Aucun utilisateur trouvé"]);
        }
        break;
        
    case 'POST':
        // Vérifier si l'utilisateur est administrateur
        if ($userData['data']['role'] !== 'administrateur' && $userData['data']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Permission refusée"]);
            exit;
        }
        
        // Obtenir les données postées
        $data = json_decode(file_get_contents("php://input"));
        
        if(
            !empty($data->nom) &&
            !empty($data->prenom) &&
            !empty($data->email) &&
            !empty($data->mot_de_passe) &&
            !empty($data->identifiant_technique) &&
            !empty($data->role)
        ) {
            // Définir les propriétés de l'utilisateur
            $user->nom = $data->nom;
            $user->prenom = $data->prenom;
            $user->email = $data->email;
            $user->mot_de_passe = $data->mot_de_passe;
            $user->identifiant_technique = $data->identifiant_technique;
            $user->role = $data->role;
            
            // Créer l'utilisateur
            if($user->create()) {
                http_response_code(201);
                echo json_encode(["message" => "Utilisateur créé avec succès"]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Impossible de créer l'utilisateur"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Données incomplètes"]);
        }
        break;
        
    case 'PUT':
        // Vérifier si l'utilisateur est administrateur
        if ($userData['data']['role'] !== 'administrateur' && $userData['data']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Permission refusée"]);
            exit;
        }
        
        // Obtenir les données
        $data = json_decode(file_get_contents("php://input"));
        
        if(
            !empty($data->id) &&
            !empty($data->nom) &&
            !empty($data->prenom) &&
            !empty($data->email) &&
            !empty($data->role)
        ) {
            // Définir les propriétés de l'utilisateur
            $user->id = $data->id;
            $user->nom = $data->nom;
            $user->prenom = $data->prenom;
            $user->email = $data->email;
            $user->role = $data->role;
            
            // Mettre à jour l'utilisateur
            if($user->update()) {
                http_response_code(200);
                echo json_encode(["message" => "Utilisateur mis à jour avec succès"]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Impossible de mettre à jour l'utilisateur"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Données incomplètes"]);
        }
        break;
        
    case 'DELETE':
        // Vérifier si l'utilisateur est administrateur
        if ($userData['data']['role'] !== 'administrateur' && $userData['data']['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["message" => "Permission refusée"]);
            exit;
        }
        
        // Obtenir l'ID à supprimer
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->id)) {
            // Définir l'ID à supprimer
            $user->id = $data->id;
            
            // Supprimer l'utilisateur
            if($user->delete()) {
                http_response_code(200);
                echo json_encode(["message" => "Utilisateur supprimé avec succès"]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Impossible de supprimer l'utilisateur"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Données incomplètes"]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["message" => "Méthode non autorisée"]);
        break;
}
?>
