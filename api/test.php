
<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

error_log("=== EXÉCUTION DE test.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion du preflight CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    $action = $_GET['action'] ?? 'test_db';
    error_log("Action demandée: " . $action);
    
    $pdo = getDbConnection();
    
    switch ($action) {
        case 'test_db':
            // Test de base de données
            $stmt = $pdo->query("SELECT VERSION() as version, DATABASE() as db_name, USER() as user");
            $result = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'message' => 'Connexion à la base de données Infomaniak réussie',
                'data' => [
                    'host' => DB_HOST,
                    'database' => DB_NAME,
                    'version' => $result['version'],
                    'user' => $result['user'],
                    'connected_db' => $result['db_name']
                ],
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
            
        case 'user_exists':
            $userId = $_GET['userId'] ?? '';
            ensureUsersTableExists($pdo);
            
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE identifiant_technique = ? OR email = ?");
            $stmt->execute([$userId, $userId]);
            $exists = (int)$stmt->fetchColumn() > 0;
            
            echo json_encode(['success' => $exists]);
            break;
            
        case 'users':
            ensureUsersTableExists($pdo);
            
            $stmt = $pdo->prepare("SELECT id, nom, prenom, email, identifiant_technique, role FROM utilisateurs");
            $stmt->execute();
            
            echo json_encode(['success' => true, 'records' => $stmt->fetchAll()]);
            break;
            
        default:
            echo json_encode([
                'success' => true, 
                'message' => 'API Infomaniak fonctionnelle', 
                'host' => DB_HOST,
                'database' => DB_NAME,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
    }
    
} catch (Exception $e) {
    error_log("Erreur dans test.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

function ensureUsersTableExists($pdo) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?");
    $stmt->execute([DB_NAME, 'utilisateurs']);
    $tableExists = (int)$stmt->fetchColumn() > 0;
    
    if (!$tableExists) {
        error_log("Création de la table utilisateurs dans la base Infomaniak");
        $pdo->exec("CREATE TABLE `utilisateurs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `nom` VARCHAR(100) NOT NULL,
            `prenom` VARCHAR(100) NOT NULL,
            `email` VARCHAR(255) NOT NULL UNIQUE,
            `mot_de_passe` VARCHAR(255) NOT NULL,
            `identifiant_technique` VARCHAR(100) NOT NULL UNIQUE,
            `role` VARCHAR(50) NOT NULL DEFAULT 'utilisateur',
            `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        // Créer l'utilisateur par défaut
        $hashedPassword = password_hash("Trottinette43!", PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO `utilisateurs` 
            (`nom`, `prenom`, `email`, `mot_de_passe`, `identifiant_technique`, `role`) 
            VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute(['Cirier', 'Antoine', 'antcirier@gmail.com', $hashedPassword, 'p71x6d_cirier', 'admin']);
        error_log("Utilisateur par défaut créé dans la base Infomaniak");
    }
}

error_log("=== FIN DE L'EXÉCUTION DE test.php ===");
?>
