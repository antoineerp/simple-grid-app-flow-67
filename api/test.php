
<?php
// Point d'entrée API unifié - Test fonctionnel et récupération des utilisateurs
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== EXÉCUTION DE test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("Agent: " . $_SERVER['HTTP_USER_AGENT']);

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Récupérer le type de requête depuis les paramètres GET
$action = isset($_GET['action']) ? $_GET['action'] : 'status';

try {
    // Configuration de la base de données (celle qui fonctionne)
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Exécuter l'action demandée
    switch ($action) {
        case 'users':
            // Récupérer les utilisateurs
            $query = "SELECT id, nom, prenom, email, role, identifiant_technique, date_creation FROM utilisateurs";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Liste des utilisateurs récupérée avec succès',
                'records' => $users,
                'count' => count($users)
            ]);
            break;
            
        case 'tables':
            // Récupérer les tables d'un utilisateur spécifique
            $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
            
            if (!$userId) {
                throw new Exception("L'identifiant utilisateur est requis pour lister les tables");
            }
            
            // Lister toutes les tables
            $stmt = $pdo->query("SHOW TABLES");
            $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Filtrer les tables appartenant à l'utilisateur spécifié
            $userTables = [];
            foreach ($allTables as $table) {
                if (strpos($table, $userId) !== false) {
                    $userTables[] = $table;
                }
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => "Tables pour l'utilisateur {$userId}",
                'user_id' => $userId,
                'tables' => $userTables,
                'count' => count($userTables)
            ]);
            break;
            
        case 'create-user':
            // Traiter la création d'un utilisateur
            error_log("Traitement de la demande de création d'utilisateur via test.php");
            
            // Récupérer les données POST en JSON
            $json_data = file_get_contents("php://input");
            error_log("Données POST brutes: " . $json_data);
            
            if (empty($json_data)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Aucune donnée reçue']);
                exit;
            }
            
            $data = json_decode($json_data, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'JSON invalide: ' . json_last_error_msg()]);
                exit;
            }
            
            // Vérifier les données nécessaires
            if (!isset($data['nom']) || !isset($data['prenom']) || !isset($data['email']) || !isset($data['role'])) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Données incomplètes']);
                exit;
            }
            
            // Vérifier si la table utilisateurs existe
            $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
            $stmt = $pdo->prepare($tableExistsQuery);
            $stmt->execute();
            $tableExists = $stmt->rowCount() > 0;
            
            if (!$tableExists) {
                // Créer la table utilisateurs
                error_log("La table utilisateurs n'existe pas, création...");
                $createTableQuery = "CREATE TABLE IF NOT EXISTS utilisateurs (
                    id VARCHAR(36) PRIMARY KEY,
                    nom VARCHAR(100) NOT NULL,
                    prenom VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    mot_de_passe VARCHAR(255) NOT NULL,
                    identifiant_technique VARCHAR(100) NOT NULL,
                    role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL,
                    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
                $pdo->exec($createTableQuery);
                error_log("Table utilisateurs créée avec succès");
            }
            
            // Vérifier si l'email existe déjà
            $emailCheckQuery = "SELECT COUNT(*) FROM utilisateurs WHERE email = ?";
            $stmt = $pdo->prepare($emailCheckQuery);
            $stmt->execute([$data['email']]);
            $emailExists = $stmt->fetchColumn() > 0;
            
            if ($emailExists) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => "L'email existe déjà"]);
                exit;
            }
            
            // Générer un ID si non fourni
            if (!isset($data['id']) || empty($data['id'])) {
                $data['id'] = uniqid('user_', true);
            }
            
            // Générer un identifiant technique si non fourni
            if (!isset($data['identifiant_technique']) || empty($data['identifiant_technique'])) {
                $sanitizedPrenom = preg_replace('/[^a-z0-9]/i', '', strtolower($data['prenom']));
                $sanitizedNom = preg_replace('/[^a-z0-9]/i', '', strtolower($data['nom']));
                $randomStr = substr(md5(uniqid(mt_rand(), true)), 0, 6);
                $data['identifiant_technique'] = "p71x6d_{$sanitizedPrenom}_{$sanitizedNom}_{$randomStr}";
            }
            
            // Hasher le mot de passe
            if (!isset($data['mot_de_passe']) || empty($data['mot_de_passe'])) {
                $data['mot_de_passe'] = 'password123'; // Mot de passe par défaut
            }
            $passwordHash = password_hash($data['mot_de_passe'], PASSWORD_DEFAULT);
            
            // Adapter le rôle si nécessaire
            $role = $data['role'];
            if ($role === 'administrateur') $role = 'admin';
            if ($role === 'utilisateur') $role = 'user';
            
            // Insertion de l'utilisateur
            try {
                $insertQuery = "INSERT INTO utilisateurs 
                    (id, nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
                    
                $stmt = $pdo->prepare($insertQuery);
                $stmt->execute([
                    $data['id'],
                    $data['nom'],
                    $data['prenom'],
                    $data['email'],
                    $passwordHash,
                    $data['identifiant_technique'],
                    $role
                ]);
                
                error_log("Utilisateur créé avec succès. ID: " . $data['id']);
                
                // Récupérer l'utilisateur créé pour confirmer
                $selectQuery = "SELECT id, nom, prenom, email, role, identifiant_technique, date_creation 
                               FROM utilisateurs WHERE id = ?";
                $stmt = $pdo->prepare($selectQuery);
                $stmt->execute([$data['id']]);
                $createdUser = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($createdUser) {
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Utilisateur créé avec succès',
                        'user' => $createdUser,
                        'success' => true,
                        'identifiant_technique' => $data['identifiant_technique']
                    ]);
                } else {
                    // L'utilisateur a été inséré mais non trouvé (cas très rare)
                    echo json_encode([
                        'status' => 'success',
                        'message' => 'Utilisateur créé avec succès, mais non récupéré',
                        'user' => [
                            'id' => $data['id'],
                            'nom' => $data['nom'],
                            'prenom' => $data['prenom'],
                            'email' => $data['email'],
                            'role' => $role,
                            'identifiant_technique' => $data['identifiant_technique']
                        ],
                        'success' => true,
                        'identifiant_technique' => $data['identifiant_technique']
                    ]);
                }
            } catch (PDOException $e) {
                error_log("Erreur lors de l'insertion: " . $e->getMessage());
                
                // Vérifier s'il s'agit d'une erreur de contrainte d'unicité (duplicate key)
                if ($e->getCode() == 23000) {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error', 
                        'message' => 'Cet utilisateur existe déjà',
                        'success' => false,
                        'error' => $e->getMessage()
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'status' => 'error', 
                        'message' => 'Erreur lors de la création: ' . $e->getMessage(),
                        'success' => false,
                        'error' => $e->getMessage()
                    ]);
                }
                exit;
            }
            break;
            
        case 'status':
        default:
            // Simple test de connexion
            $version = $pdo->query('SELECT VERSION()')->fetchColumn();
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'API test endpoint fonctionnel',
                'connection' => 'Connexion PDO réussie à la base richard',
                'db_version' => $version,
                'tables_count' => count($tables),
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
    }
} catch (PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de connexion à la base de données',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Erreur: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

error_log("=== FIN DE test.php ===");
?>
