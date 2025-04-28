
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Fichier pour gérer les opérations CRUD sur les utilisateurs
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'appel
error_log("API users.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Configuration de la base de données (reprise depuis check-users.php)
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Nettoyer tout buffer de sortie existant
    if (ob_get_level()) ob_clean();

    // Connexion à la base de données
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion PDO directe à la base de données");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie");
    
    // Traiter selon la méthode HTTP
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Récupérer tous les utilisateurs ou un utilisateur spécifique
            if (isset($_GET['id'])) {
                $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
                if (!$id) {
                    throw new Exception("ID d'utilisateur invalide");
                }
                
                $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs WHERE id = :id";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(":id", $id);
                $stmt->execute();
                $user = $stmt->fetch();
                
                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['status' => 'error', 'message' => 'Utilisateur non trouvé']);
                    exit;
                }
                
                echo json_encode(['status' => 'success', 'data' => $user]);
                exit;
            } else {
                // Récupérer tous les utilisateurs
                $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation, mot_de_passe FROM utilisateurs";
                $stmt = $pdo->prepare($query);
                $stmt->execute();
                $users = $stmt->fetchAll();
                
                echo json_encode(['status' => 'success', 'data' => ['records' => $users]]);
                exit;
            }
            break;
        
        case 'POST':
            // Récupérer les données POST
            $data = json_decode(file_get_contents("php://input"), true);
            error_log("Données POST reçues: " . json_encode($data));
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Données invalides']);
                exit;
            }
            
            // Validation des données requises
            $required = ['nom', 'prenom', 'email', 'mot_de_passe', 'identifiant_technique', 'role'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => "Le champ {$field} est requis"]);
                    exit;
                }
            }
            
            // Vérifier si l'email existe déjà
            $query = "SELECT COUNT(*) FROM utilisateurs WHERE email = :email";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(":email", $data['email']);
            $stmt->execute();
            
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => "Un utilisateur avec cet email existe déjà"]);
                exit;
            }
            
            // Vérifier si l'identifiant technique existe déjà
            $query = "SELECT COUNT(*) FROM utilisateurs WHERE identifiant_technique = :identifiant_technique";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(":identifiant_technique", $data['identifiant_technique']);
            $stmt->execute();
            
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => "Un utilisateur avec cet identifiant technique existe déjà"]);
                exit;
            }
            
            // Vérifier si la table existe
            $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
            $stmt = $pdo->prepare($tableExistsQuery);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                // La table n'existe pas, la créer
                error_log("La table 'utilisateurs' n'existe pas, création en cours");
                $createTableQuery = "CREATE TABLE IF NOT EXISTS utilisateurs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL,
                    prenom VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    mot_de_passe VARCHAR(255) NOT NULL,
                    identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
                    role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL,
                    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
                $pdo->exec($createTableQuery);
                error_log("Table 'utilisateurs' créée avec succès");
            }
            
            // Hasher le mot de passe s'il n'est pas déjà hashé
            $password = $data['mot_de_passe'];
            if (!password_get_info($password)['algo']) {
                $password = password_hash($password, PASSWORD_BCRYPT);
            }
            
            // Insérer l'utilisateur
            $query = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation) 
                      VALUES (:nom, :prenom, :email, :mot_de_passe, :identifiant_technique, :role, NOW())";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(":nom", $data['nom']);
            $stmt->bindParam(":prenom", $data['prenom']);
            $stmt->bindParam(":email", $data['email']);
            $stmt->bindParam(":mot_de_passe", $password);
            $stmt->bindParam(":identifiant_technique", $data['identifiant_technique']);
            $stmt->bindParam(":role", $data['role']);
            $stmt->execute();
            
            $id = $pdo->lastInsertId();
            
            // Récupérer l'utilisateur créé
            $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            $user = $stmt->fetch();
            
            echo json_encode(['status' => 'success', 'message' => 'Utilisateur créé avec succès', 'data' => $user]);
            exit;
            break;
            
        case 'PUT':
            // Récupérer les données PUT
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data || !isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Données invalides ou ID manquant']);
                exit;
            }
            
            // Vérifier si l'utilisateur existe
            $query = "SELECT COUNT(*) FROM utilisateurs WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(":id", $data['id']);
            $stmt->execute();
            
            if ($stmt->fetchColumn() == 0) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => "Utilisateur non trouvé"]);
                exit;
            }
            
            // Construire la requête de mise à jour
            $updates = [];
            $params = [':id' => $data['id']];
            
            $allowedFields = ['nom', 'prenom', 'email', 'role'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field]) && !empty($data[$field])) {
                    $updates[] = "{$field} = :{$field}";
                    $params[":{$field}"] = $data[$field];
                }
            }
            
            if (isset($data['mot_de_passe']) && !empty($data['mot_de_passe'])) {
                // Hasher le mot de passe s'il n'est pas déjà hashé
                $password = $data['mot_de_passe'];
                if (!password_get_info($password)['algo']) {
                    $password = password_hash($password, PASSWORD_BCRYPT);
                }
                
                $updates[] = "mot_de_passe = :mot_de_passe";
                $params[':mot_de_passe'] = $password;
            }
            
            // S'il n'y a pas de champs à mettre à jour
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => "Aucun champ à mettre à jour"]);
                exit;
            }
            
            $query = "UPDATE utilisateurs SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->execute();
            
            // Récupérer l'utilisateur mis à jour
            $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(":id", $data['id']);
            $stmt->execute();
            $user = $stmt->fetch();
            
            echo json_encode(['status' => 'success', 'message' => 'Utilisateur mis à jour avec succès', 'data' => $user]);
            exit;
            break;
            
        case 'DELETE':
            // Récupérer l'ID à supprimer
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data || !isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'ID utilisateur manquant']);
                exit;
            }
            
            // Vérifier si l'utilisateur existe
            $query = "SELECT COUNT(*) FROM utilisateurs WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(":id", $data['id']);
            $stmt->execute();
            
            if ($stmt->fetchColumn() == 0) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => "Utilisateur non trouvé"]);
                exit;
            }
            
            // Supprimer l'utilisateur
            $query = "DELETE FROM utilisateurs WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(":id", $data['id']);
            $stmt->execute();
            
            echo json_encode(['status' => 'success', 'message' => 'Utilisateur supprimé avec succès']);
            exit;
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
            exit;
    }
} catch (PDOException $e) {
    error_log("Erreur PDO dans users.php: " . $e->getMessage());
    
    // Nettoyer le buffer en cas d'erreur
    if (ob_get_level()) ob_clean();
    
    // Réponse d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Exception dans users.php: " . $e->getMessage());
    
    // Nettoyer le buffer en cas d'erreur
    if (ob_get_level()) ob_clean();
    
    // Réponse d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
    exit;
} finally {
    // S'assurer que tout buffer est vidé
    if (ob_get_level()) ob_end_flush();
}
?>
