
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
    // Créer une instance de Database avec diagnostic complet
    $database = new Database();
    $db = $database->getConnection(true); // Active le mode de diagnostic
    
    if (!$database->is_connected) {
        error_log("Erreur de connexion à la DB: " . ($database->connection_error ?? "Erreur inconnue"));
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    } else {
        error_log("Connexion à la base de données réussie");
    }

    // Vérifier les tables et leur structure
    try {
        $checkTablesQuery = "SHOW TABLES";
        $stmt = $db->query($checkTablesQuery);
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        error_log("Tables disponibles: " . implode(", ", $tables));
        
        // Vérifier le moteur de stockage et l'encodage
        foreach ($tables as $table) {
            $tableInfoQuery = "SHOW TABLE STATUS WHERE Name = '$table'";
            $stmt = $db->query($tableInfoQuery);
            $tableInfo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            error_log("Table $table: Engine=" . $tableInfo['Engine'] . ", Collation=" . $tableInfo['Collation']);
            
            // Vérifier les colonnes
            $columnsQuery = "SHOW COLUMNS FROM `$table`";
            $stmt = $db->query($columnsQuery);
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($columns as $column) {
                if ($column['Key'] == 'PRI') {
                    error_log("Table $table: Clé primaire=" . $column['Field'] . ", Type=" . $column['Type'] . ", Extra=" . $column['Extra']);
                }
            }
        }
    } catch (PDOException $e) {
        error_log("Erreur lors de la vérification des tables: " . $e->getMessage());
        // Ne pas interrompre le flux principal
    }

    // Créer une instance de User
    $user = new User($db);

    // Traiter la requête en fonction de la méthode HTTP
    switch ($method) {
        case 'GET':
            // Vérifier si c'est une vérification d'email
            if (isset($_GET['email'])) {
                error_log("Vérification d'email: " . $_GET['email']);
                
                $email = htmlspecialchars(strip_tags($_GET['email']));
                
                // Vérifier si l'email existe déjà dans la base de données
                $stmt = $user->findByEmailQuery($email);
                $num = $stmt ? $stmt->rowCount() : 0;
                
                $users_arr = array();
                $users_arr["records"] = array();
                
                if ($num > 0) {
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        // Masquer le mot de passe
                        $row['mot_de_passe'] = '******';
                        array_push($users_arr["records"], $row);
                    }
                }
                
                http_response_code(200);
                echo json_encode($users_arr);
                exit;
            }
            
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
                    // Vérifier si le rôle est "gestionnaire" et s'il y a déjà un gestionnaire
                    if ($data->role === 'gestionnaire') {
                        $existingManagerCount = $user->countUsersByRole('gestionnaire');
                        if ($existingManagerCount > 0) {
                            http_response_code(409); // Conflict
                            echo json_encode(array(
                                "message" => "Un seul compte gestionnaire peut être créé. Un compte existe déjà.",
                                "status" => 409,
                                "field" => "role"
                            ));
                            exit;
                        }
                    }
                    
                    // Vérifier d'abord si l'email existe déjà
                    if ($user->emailExists($data->email)) {
                        http_response_code(409); // Conflict
                        echo json_encode(array(
                            "message" => "Un utilisateur avec cet email existe déjà.",
                            "status" => 409,
                            "field" => "email"
                        ));
                        exit;
                    }
                    
                    // Vérifier si l'identifiant technique existe déjà
                    if ($user->identifiantExists($data->identifiant_technique)) {
                        // Générer un nouvel identifiant
                        $timestamp = time();
                        $random = substr(md5(rand()), 0, 8);
                        $newIdentifiant = $data->identifiant_technique . "_" . $random . "_" . $timestamp;
                        
                        error_log("UsersController - Identifiant technique existant, nouveau généré: " . $newIdentifiant);
                        $data->identifiant_technique = $newIdentifiant;
                    }
                    
                    $user->nom = $data->nom;
                    $user->prenom = $data->prenom;
                    $user->email = $data->email;
                    $user->identifiant_technique = $data->identifiant_technique;
                    $user->mot_de_passe = $data->mot_de_passe;
                    $user->role = $data->role;
                    
                    // Logs supplémentaires pour débugger
                    error_log("Tentative de création d'utilisateur avec les données:");
                    error_log("Nom: " . $user->nom);
                    error_log("Prénom: " . $user->prenom);
                    error_log("Email: " . $user->email);
                    error_log("Identifiant: " . $user->identifiant_technique);
                    error_log("Rôle: " . $user->role);
                    
                    // Ne pas définir l'ID manuellement, laisser l'auto-incrémentation fonctionner
                    unset($user->id);
                    
                    if ($user->create()) {
                        // Récupérer le dernier ID inséré
                        $lastId = $db->lastInsertId();
                        error_log("Utilisateur créé avec succès, ID: " . $lastId);
                        
                        // Si c'est un utilisateur standard, copier les données du gestionnaire s'il existe
                        if ($user->role === 'utilisateur') {
                            $user->initializeUserDataFromManager($lastId);
                            error_log("Tentative d'initialisation des données utilisateur à partir du gestionnaire");
                        }
                        
                        http_response_code(201);
                        echo json_encode(array(
                            "message" => "Utilisateur créé avec succès.",
                            "success" => true,
                            "user" => array(
                                "id" => $lastId,
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
                    error_log("UsersController POST - PDOException: " . $e->getMessage() . " - Code: " . $e->getCode());
                    http_response_code(500);
                    
                    // Vérifier si c'est une erreur de clé primaire dupliquée
                    if ($e->getCode() == 23000 && strpos($e->getMessage(), '1062') !== false) {
                        if (strpos($e->getMessage(), 'email') !== false) {
                            echo json_encode(array(
                                "message" => "Un utilisateur avec cet email existe déjà.",
                                "field" => "email",
                                "debug_error" => $e->getMessage()
                            ));
                        } else if (strpos($e->getMessage(), 'identifiant_technique') !== false) {
                            echo json_encode(array(
                                "message" => "Un utilisateur avec cet identifiant technique existe déjà.",
                                "field" => "identifiant_technique",
                                "debug_error" => $e->getMessage()
                            ));
                        } else if (strpos($e->getMessage(), 'PRIMARY') !== false) {
                            echo json_encode(array(
                                "message" => "Erreur de clé primaire. Veuillez réessayer.",
                                "field" => "id",
                                "debug_error" => $e->getMessage()
                            ));
                        } else {
                            echo json_encode(array(
                                "message" => "Violation de contrainte d'intégrité: " . $e->getMessage(),
                                "debug_info" => "Vérifiez que tous les champs obligatoires sont remplis et corrects."
                            ));
                        }
                    } else {
                        echo json_encode(array(
                            "message" => "Erreur lors de la création de l'utilisateur: " . $e->getMessage(),
                            "debug_info" => "Type d'erreur: " . $e->getCode()
                        ));
                    }
                } catch (Exception $e) {
                    error_log("UsersController POST - Exception: " . $e->getMessage());
                    http_response_code(500);
                    echo json_encode(array(
                        "message" => "Erreur lors de la création de l'utilisateur: " . $e->getMessage(),
                        "debug_info" => get_class($e) . " - Code: " . $e->getCode()
                    ));
                }
            } else {
                error_log("UsersController POST - Données incomplètes: " . json_encode($data));
                
                // Déterminer quels champs sont manquants
                $missing_fields = [];
                if (empty($data->nom)) $missing_fields[] = "nom";
                if (empty($data->prenom)) $missing_fields[] = "prenom";
                if (empty($data->email)) $missing_fields[] = "email";
                if (empty($data->identifiant_technique)) $missing_fields[] = "identifiant_technique";
                if (empty($data->mot_de_passe)) $missing_fields[] = "mot_de_passe";
                if (empty($data->role)) $missing_fields[] = "role";
                
                http_response_code(400);
                echo json_encode(array(
                    "message" => "Impossible de créer l'utilisateur. Les données sont incomplètes.",
                    "missing_fields" => $missing_fields
                ));
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
    echo json_encode(array(
        "message" => "Erreur serveur: " . $e->getMessage(),
        "debug_info" => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()
    ));
}
?>
