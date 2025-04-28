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

// Configuration de la base de données
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
                $query = "SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs";
                $stmt = $pdo->prepare($query);
                $stmt->execute();
                $users = $stmt->fetchAll();
                
                echo json_encode(['status' => 'success', 'data' => ['records' => $users]]);
                exit;
            }
            break;
        
        case 'POST':
            // Get the POST data
            $data = json_decode(file_get_contents("php://input"), true);
            error_log("Données POST reçues: " . json_encode($data));
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Données invalides']);
                exit;
            }
            
            // Validate required fields
            $required = ['nom', 'prenom', 'email', 'role'];
            $errors = [];
            
            foreach ($required as $field) {
                if (!isset($data[$field]) || trim($data[$field]) === '') {
                    $errors[] = "Le champ {$field} est requis";
                }
            }
            
            // Validate email format
            if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = "Format d'email invalide";
            }
            
            // Validate role
            $valid_roles = ['administrateur', 'utilisateur', 'gestionnaire'];
            if (isset($data['role']) && !in_array($data['role'], $valid_roles)) {
                $errors[] = "Rôle invalide. Les rôles valides sont: " . implode(', ', $valid_roles);
            }
            
            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Validation échouée', 'errors' => $errors]);
                exit;
            }
            
            // Generate UUID for ID if not provided or empty
            if (!isset($data['id']) || empty(trim($data['id']))) {
                $data['id'] = sprintf(
                    '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                    mt_rand(0, 0xffff),
                    mt_rand(0, 0x0fff) | 0x4000,
                    mt_rand(0, 0x3fff) | 0x8000,
                    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
                );
                error_log("UUID généré pour l'ID: " . $data['id']);
            }
            
            // Générer un identifiant technique si non fourni
            if (!isset($data['identifiant_technique']) || empty($data['identifiant_technique'])) {
                $timestamp = time();
                $randomStr = substr(md5(uniqid(mt_rand(), true)), 0, 8);
                $prenom = isset($data['prenom']) ? preg_replace('/[^a-z0-9]/i', '', strtolower($data['prenom'])) : 'user';
                $nom = isset($data['nom']) ? preg_replace('/[^a-z0-9]/i', '', strtolower($data['nom'])) : 'test';
                $data['identifiant_technique'] = "p71x6d_{$prenom}_{$nom}_{$randomStr}_{$timestamp}";
                error_log("Identifiant technique généré: " . $data['identifiant_technique']);
            }
            
            // Définir un rôle par défaut si non fourni
            if (!isset($data['role']) || empty($data['role'])) {
                $data['role'] = 'utilisateur';
            }
            
            // Hasher le mot de passe s'il est fourni et n'est pas déjà hashé
            if (isset($data['mot_de_passe']) && !empty($data['mot_de_passe'])) {
                if (!password_get_info($data['mot_de_passe'])['algo']) {
                    $data['mot_de_passe'] = password_hash($data['mot_de_passe'], PASSWORD_BCRYPT);
                }
            } else {
                // Mot de passe par défaut si non fourni
                $data['mot_de_passe'] = password_hash('Test123!', PASSWORD_BCRYPT);
            }
            
            // Vérifier si l'email existe déjà
            $stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = :email");
            $stmt->execute(['email' => $data['email']]);
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => "Un utilisateur avec cet email existe déjà"]);
                exit;
            }
            
            // Vérifier si l'identifiant technique existe déjà
            $stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE identifiant_technique = :identifiant_technique");
            $stmt->execute(['identifiant_technique' => $data['identifiant_technique']]);
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => "Un utilisateur avec cet identifiant technique existe déjà"]);
                exit;
            }
            
            // Vérifier le nombre d'utilisateurs gestionnaires si un nouveau gestionnaire est créé
            if ($data['role'] === 'gestionnaire') {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE role = 'gestionnaire'");
                $stmt->execute();
                $count = $stmt->fetchColumn();
                if ($count > 0) {
                    http_response_code(400);
                    echo json_encode(['status' => 'error', 'message' => "Un seul compte gestionnaire est autorisé dans le système"]);
                    exit;
                }
            }
            
            // Vérifier si la table existe
            $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
            $stmt = $pdo->prepare($tableExistsQuery);
            $stmt->execute();
            
            if ($stmt->rowCount() == 0) {
                // La table n'existe pas, la créer
                error_log("La table 'utilisateurs' n'existe pas, création en cours");
                $createTableQuery = "CREATE TABLE IF NOT EXISTS utilisateurs (
                    id VARCHAR(36) NOT NULL PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL,
                    prenom VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    mot_de_passe VARCHAR(255) NOT NULL,
                    identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
                    role ENUM('admin','user','administrateur','utilisateur','gestionnaire') NOT NULL,
                    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
                $pdo->exec($createTableQuery);
                error_log("Table 'utilisateurs' créée avec succès");
            }
            
            try {
                // Insérer l'utilisateur avec un ID explicite
                $query = "INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                         VALUES (:id, :nom, :prenom, :email, :mot_de_passe, :identifiant_technique, :role)";
                $stmt = $pdo->prepare($query);
                
                $params = [
                    'id' => $data['id'],
                    'nom' => $data['nom'],
                    'prenom' => $data['prenom'],
                    'email' => $data['email'],
                    'mot_de_passe' => $data['mot_de_passe'],
                    'identifiant_technique' => $data['identifiant_technique'],
                    'role' => $data['role']
                ];
                
                error_log("Exécution de l'insertion avec ID: " . $data['id']);
                
                // Exécuter la requête et vérifier le résultat
                $result = $stmt->execute($params);
                
                if (!$result) {
                    error_log("Erreur lors de l'exécution de la requête INSERT: " . json_encode($stmt->errorInfo()));
                    throw new Exception("Échec de l'insertion en base de données: " . implode(", ", $stmt->errorInfo()));
                }
                
                error_log("Utilisateur créé avec succès. ID: " . $data['id']);
                
                // Récupérer l'utilisateur créé
                $stmt = $pdo->prepare("SELECT id, nom, prenom, email, identifiant_technique, role, date_creation FROM utilisateurs WHERE id = :id");
                $stmt->execute(['id' => $data['id']]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    error_log("Utilisateur non trouvé après création. ID recherché: " . $data['id']);
                    throw new Exception("Utilisateur créé mais impossible de le récupérer");
                }
                
                http_response_code(201); // Created
                echo json_encode(['status' => 'success', 'message' => 'Utilisateur créé avec succès', 'data' => $user]);
                exit;
            } catch (PDOException $e) {
                error_log("PDOException lors de l'insertion: " . $e->getMessage());
                error_log("SQL state: " . $e->getCode());
                error_log("Error info: " . json_encode($stmt->errorInfo()));
                
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Erreur lors de la création de l\'utilisateur: ' . $e->getMessage()]);
                exit;
            }
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
