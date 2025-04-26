
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
    // Définir la constante pour le contrôle d'accès direct pour permettre l'accès
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
            try {
                // Forcer la création de la table si elle n'existe pas
                if (method_exists($user, 'createTableIfNotExists')) {
                    $user->createTableIfNotExists();
                }
                
                // Récupère tous les utilisateurs
                if (method_exists($user, 'readAll')) {
                    $stmt = $user->readAll();
                    $num = $stmt->rowCount();
                    
                    $users_arr = ["records" => []];
                    
                    if ($num > 0) {
                        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                            // Masquer le mot de passe dans la réponse
                            if (isset($row['mot_de_passe'])) {
                                $row['mot_de_passe'] = '******';
                            }
                            array_push($users_arr["records"], $row);
                        }
                    }
                    
                    http_response_code(200);
                    echo json_encode($users_arr);
                } else {
                    throw new Exception("Méthode readAll non disponible dans le modèle User");
                }
            } catch (Exception $e) {
                error_log("Erreur GET utilisateurs: " . $e->getMessage());
                http_response_code(200);
                echo json_encode(["message" => "Erreur lors de la récupération des utilisateurs: " . $e->getMessage(), "records" => []]);
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
            if ($data->role === 'gestionnaire' && method_exists($user, 'countUsersByRole')) {
                $gestionnaire_count = $user->countUsersByRole('gestionnaire');
                if ($gestionnaire_count > 0) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "message" => "Un seul compte gestionnaire peut être créé"]);
                    break;
                }
            }

            // Vérifier si l'email existe déjà
            if (method_exists($user, 'emailExists') && $user->emailExists($data->email)) {
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
            if (method_exists($user, 'create') && $user->create()) {
                $lastId = $db->lastInsertId();
                error_log("Utilisateur créé avec ID: {$lastId}");
                
                if ($data->role === 'utilisateur' && method_exists($user, 'initializeUserDataFromManager')) {
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
            
        case 'DELETE':
            // Capturer les données brutes
            $deleteData = file_get_contents("php://input");
            error_log("DELETE - Données brutes reçues: " . $deleteData);
            
            if (empty($deleteData)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Aucune donnée reçue"]);
                break;
            }
            
            // Décoder en JSON
            $data = json_decode($deleteData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Erreur de décodage JSON: " . json_last_error_msg()]);
                break;
            }
            
            // Valider l'ID
            if (!isset($data->id) || !is_numeric($data->id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ID utilisateur non fourni ou invalide"]);
                break;
            }
            
            // Vérifier que l'utilisateur existe
            if (method_exists($user, 'findById')) {
                $userData = $user->findById($data->id);
                if (!$userData) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "message" => "Utilisateur non trouvé"]);
                    break;
                }
                
                // Supprimer l'utilisateur
                try {
                    $query = "DELETE FROM utilisateurs WHERE id = :id";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':id', $data->id);
                    
                    if ($stmt->execute()) {
                        http_response_code(200);
                        echo json_encode([
                            "status" => "success",
                            "message" => "Utilisateur supprimé avec succès"
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["status" => "error", "message" => "Échec de suppression de l'utilisateur"]);
                    }
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode([
                        "status" => "error", 
                        "message" => "Erreur lors de la suppression : " . $e->getMessage()
                    ]);
                }
            } else {
                http_response_code(501);
                echo json_encode(["status" => "error", "message" => "Fonctionnalité de recherche d'utilisateur non implémentée"]);
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
