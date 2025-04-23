
<?php
// Vérifier si la constante de protection est définie
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

// Inclure les fichiers nécessaires avec des chemins relatifs plus robustes
$baseDir = dirname(__DIR__); // Remonte au répertoire parent (api/)
require_once $baseDir . '/config/database.php';
require_once $baseDir . '/models/User.php';

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

// Fonction pour nettoyer les données UTF-8 si elle n'existe pas
if (!function_exists('cleanUTF8')) {
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
}

// Journaliser la requête pour débogage
error_log("UsersController - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Récupérer la méthode HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Créer une instance de Database
    $database = new Database();
    $db = $database->getConnection(false);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

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
            // Vérifier que nous avons reçu des données
            $raw_input = file_get_contents("php://input");
            error_log("UsersController POST - Données brutes reçues: " . $raw_input);
            
            // Créer un utilisateur
            $data = json_decode($raw_input);
            
            // Vérifier que le décodage JSON est correct
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("UsersController POST - Erreur de décodage JSON: " . json_last_error_msg());
                http_response_code(400);
                echo json_encode(array("message" => "Erreur de décodage JSON: " . json_last_error_msg()));
                exit;
            }
            
            // Journaliser les données reçues
            error_log("UsersController POST - Données décodées: " . json_encode($data));
            
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
                        echo json_encode(array(
                            "message" => "Utilisateur créé avec succès.",
                            "success" => true,
                            "user" => array(
                                "nom" => $data->nom,
                                "prenom" => $data->prenom,
                                "email" => $data->email,
                                "identifiant_technique" => $data->identifiant_technique,
                                "role" => $data->role
                            )
                        ));
                    } else {
                        error_log("UsersController POST - Échec de la création: erreur dans user->create()");
                        http_response_code(503);
                        echo json_encode(array("message" => "Impossible de créer l'utilisateur."));
                    }
                } catch (PDOException $e) {
                    error_log("UsersController POST - PDOException: " . $e->getMessage());
                    http_response_code(500);
                    
                    // Vérifier si c'est une erreur de clé primaire dupliquée
                    if ($e->getCode() == 23000 && strpos($e->getMessage(), '1062') !== false) {
                        if (strpos($e->getMessage(), 'email') !== false) {
                            echo json_encode(array("message" => "Un utilisateur avec cet email existe déjà."));
                        } else if (strpos($e->getMessage(), 'identifiant_technique') !== false) {
                            echo json_encode(array("message" => "Un utilisateur avec cet identifiant technique existe déjà."));
                        } else {
                            echo json_encode(array("message" => "Violation de contrainte d'intégrité: " . $e->getMessage()));
                        }
                    } else {
                        echo json_encode(array("message" => "Erreur lors de la création de l'utilisateur: " . $e->getMessage()));
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
