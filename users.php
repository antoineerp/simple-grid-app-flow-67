
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Configuration des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0); // Ne pas afficher les erreurs dans la réponse
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// En-têtes CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journaliser l'appel
error_log("API users.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Nettoyer tout buffer de sortie existant
if (ob_get_level()) ob_clean();

try {
    // Définir la constante pour le contrôle d'accès direct - modifier pour toujours autoriser
    define('DIRECT_ACCESS_CHECK', true);

    // Inclure les fichiers de base nécessaires
    $files_to_include = [
        __DIR__ . '/config/database.php',
        __DIR__ . '/utils/ResponseHandler.php',
        __DIR__ . '/models/User.php'
    ];
    
    // Vérifier et charger chaque fichier
    foreach ($files_to_include as $file) {
        if (!file_exists($file)) {
            throw new Exception("Fichier requis manquant: " . basename($file));
        }
        require_once $file;
    }
    
    // Initialiser la base de données
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }
    
    // Initialiser le modèle utilisateur
    $user = new User($db);
    
    // Inclure les opérations en fonction de la méthode HTTP
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Vérifier si le fichier existe avant de l'inclure
            $getOperationsFile = __DIR__ . '/operations/users/GetOperations.php';
            if (file_exists($getOperationsFile)) {
                require_once $getOperationsFile;
                $operations = new UserGetOperations($user);
                $operations->handleGetRequest();
            } else {
                // Méthode alternative pour obtenir des utilisateurs
                $stmt = $user->readAll();
                $num = $stmt->rowCount();
                
                if ($num > 0) {
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
                            "mot_de_passe" => $mot_de_passe,
                            "role" => $role,
                            "date_creation" => $date_creation
                        );
                        
                        array_push($users_arr["records"], $user_item);
                    }
                    
                    http_response_code(200);
                    echo json_encode($users_arr);
                } else {
                    http_response_code(200);
                    echo json_encode(["message" => "Aucun utilisateur trouvé", "records" => []]);
                }
            }
            break;
        
        case 'POST':
            // Capturer les données brutes
            $postData = file_get_contents("php://input");
            error_log("UserPostOperations::handlePostRequest - Données brutes reçues: " . $postData);
            
            if (empty($postData)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Aucune donnée reçue"]);
                break;
            }
            
            // Décoder en JSON
            $data = json_decode($postData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Erreur de décodage JSON: " . json_last_error_msg()]);
                break;
            }
            
            error_log("UserPostOperations - Données décodées: " . json_encode($data));

            // Valider les données minimales requises
            if (!isset($data->nom) || !isset($data->prenom) || !isset($data->email) || 
                !isset($data->identifiant_technique) || !isset($data->mot_de_passe) || !isset($data->role)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Données incomplètes ou invalides"]);
                break;
            }

            // Vérifier les restrictions (un seul gestionnaire)
            if ($data->role === 'gestionnaire') {
                $gestionnaire_count = $user->countUsersByRole('gestionnaire');
                if ($gestionnaire_count > 0) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "message" => "Un seul compte gestionnaire peut être créé"]);
                    break;
                }
            }

            // Vérifier si l'email existe déjà
            if ($user->emailExists($data->email)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Email déjà utilisé"]);
                break;
            }

            // Assigner les valeurs à l'objet utilisateur
            $user->nom = $data->nom;
            $user->prenom = $data->prenom;
            $user->email = $data->email;
            $user->identifiant_technique = $data->identifiant_technique;
            $user->mot_de_passe = password_hash($data->mot_de_passe, PASSWORD_DEFAULT); // Hachage sécurisé
            $user->role = $data->role;

            error_log("Tentative de création de l'utilisateur: {$data->prenom} {$data->nom}");
            
            // Créer l'utilisateur
            if ($user->create()) {
                $lastId = $db->lastInsertId();
                error_log("Utilisateur créé avec ID: {$lastId}");
                
                if ($data->role === 'utilisateur') {
                    $user->initializeUserDataFromManager($data->identifiant_technique);
                }

                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "message" => "Utilisateur créé avec succès",
                    "id" => $lastId,
                    "identifiant_technique" => $data->identifiant_technique,
                    "nom" => $data->nom,
                    "prenom" => $data->prenom,
                    "email" => $data->email,
                    "role" => $data->role
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Échec de création de l'utilisateur"]);
            }
            break;
            
        case 'PUT':
            // Redirection vers le fichier PutOperations s'il existe
            $putOperationsFile = __DIR__ . '/operations/users/PutOperations.php';
            if (file_exists($putOperationsFile)) {
                require_once $putOperationsFile;
                $operations = new UserPutOperations($user);
                $operations->handlePutRequest();
            } else {
                http_response_code(501);
                echo json_encode(["status" => "error", "message" => "Fonctionnalité de mise à jour non implémentée"]);
            }
            break;
            
        case 'DELETE':
            // Redirection vers le fichier DeleteOperations s'il existe
            $deleteOperationsFile = __DIR__ . '/operations/users/DeleteOperations.php';
            if (file_exists($deleteOperationsFile)) {
                require_once $deleteOperationsFile;
                $operations = new UserDeleteOperations($user);
                $operations->handleDeleteRequest();
            } else {
                http_response_code(501);
                echo json_encode(["status" => "error", "message" => "Fonctionnalité de suppression non implémentée"]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
            break;
    }
} catch (Exception $e) {
    error_log("Erreur dans users.php: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    
    // Nettoyer tout buffer de sortie existant
    if (ob_get_level()) ob_clean();
    
    // S'assurer que les en-têtes sont correctement définis
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => "Erreur serveur: " . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}

// S'assurer que tout buffer est vidé
if (ob_get_level()) ob_end_flush();
?>
