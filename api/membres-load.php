
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/DataSyncService.php';
require_once 'services/RequestHandler.php';

// Nom de la table à synchroniser
$tableName = 'membres';

// Créer le service de synchronisation
$service = new DataSyncService($tableName);

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("GET, OPTIONS");
RequestHandler::handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. Utilisez GET.']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Vérifier si l'userId est présent
    $userId = "";
    
    if (isset($_GET['userId']) && !empty($_GET['userId'])) {
        $userId = RequestHandler::sanitizeUserId($_GET['userId']);
    } else {
        error_log("UserId manquant dans la requête");
        throw new Exception("UserId manquant");
    }
    
    // Récupérer l'ID de l'appareil s'il est fourni
    $deviceId = isset($_GET['deviceId']) ? $_GET['deviceId'] : 'unknown';
    
    error_log("Chargement des membres pour l'utilisateur: {$userId} depuis l'appareil: {$deviceId}");
    
    // Connexion à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Nom de la table spécifique à l'utilisateur
    $userTableName = "{$tableName}_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    error_log("Table à consulter: {$userTableName}");
    
    // Obtenir une référence PDO
    $pdo = $service->getPdo();
    
    // Vérifier si la table existe
    $tableExists = false;
    
    // Utiliser information_schema pour vérifier l'existence de la table
    $dbName = $pdo->query("SELECT DATABASE()")->fetchColumn();
    $tableExistsQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
    $stmt = $pdo->prepare($tableExistsQuery);
    
    // Vérifier la table
    $stmt->execute([$dbName, $userTableName]);
    $tableExists = (int)$stmt->fetchColumn() > 0;
    
    // Enregistrer cette requête de chargement
    try {
        // Créer la table d'historique si elle n'existe pas
        $pdo->exec("CREATE TABLE IF NOT EXISTS `sync_history` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `table_name` VARCHAR(100) NOT NULL,
            `user_id` VARCHAR(50) NOT NULL,
            `device_id` VARCHAR(100) NOT NULL,
            `record_count` INT NOT NULL,
            `operation` VARCHAR(50) DEFAULT 'sync',
            `sync_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_user_device` (`user_id`, `device_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        // Insérer l'enregistrement de chargement
        $stmt = $pdo->prepare("INSERT INTO `sync_history` 
                              (table_name, user_id, device_id, record_count, operation, sync_timestamp) 
                              VALUES (?, ?, ?, 0, 'load', NOW())");
        $stmt->execute([$tableName, $userId, $deviceId]);
    } catch (Exception $e) {
        // Continuer même si l'enregistrement échoue
        error_log("Erreur lors de l'enregistrement de l'historique de chargement: " . $e->getMessage());
    }
    
    // Initialiser les résultats
    $membres = [];
    
    // Simuler des données pour le test
    $mockData = [
        [
            'id' => '1',
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'fonction' => 'Directeur',
            'initiales' => 'JD',
            'email' => 'jean.dupont@example.com',
            'telephone' => '+33 6 12 34 56 78',
            'userId' => $userId,
            'date_creation' => date('Y-m-d H:i:s')
        ],
        [
            'id' => '2',
            'nom' => 'Martin',
            'prenom' => 'Sophie',
            'fonction' => 'Responsable RH',
            'initiales' => 'SM',
            'email' => 'sophie.martin@example.com',
            'telephone' => '+33 6 23 45 67 89',
            'userId' => $userId,
            'date_creation' => date('Y-m-d H:i:s', strtotime('-2 days'))
        ]
    ];
    
    // Récupérer les données si la table existe
    if ($tableExists) {
        // Vérifier si la colonne last_sync_device existe
        $columnsResult = $pdo->query("SHOW COLUMNS FROM `{$userTableName}` LIKE 'last_sync_device'");
        $hasLastSyncColumn = $columnsResult->rowCount() > 0;
        
        if (!$hasLastSyncColumn) {
            // Ajouter la colonne si elle n'existe pas
            $pdo->exec("ALTER TABLE `{$userTableName}` ADD COLUMN `last_sync_device` VARCHAR(100) NULL");
            error_log("Colonne last_sync_device ajoutée à {$userTableName}");
        }
        
        $query = "SELECT * FROM `{$userTableName}` WHERE userId = ? ORDER BY id";
        error_log("Exécution de la requête: {$query}");
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $membres = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Si aucun membre trouvé, utiliser les données de test
        if (empty($membres)) {
            error_log("Aucun membre trouvé dans la table, utilisation des données de test");
            $membres = $mockData;
        } else {
            error_log("Membres récupérés: " . count($membres));
            // Formater les dates pour le client
            foreach ($membres as &$membre) {
                // Convertir les dates
                if (isset($membre['date_creation']) && $membre['date_creation']) {
                    $membre['date_creation'] = date('Y-m-d\TH:i:s', strtotime($membre['date_creation']));
                }
                if (isset($membre['date_modification']) && $membre['date_modification']) {
                    $membre['date_modification'] = date('Y-m-d\TH:i:s', strtotime($membre['date_modification']));
                }
                
                // S'assurer que chaque membre a un userId
                if (!isset($membre['userId'])) {
                    $membre['userId'] = $userId;
                }
            }
        }
    } else {
        error_log("Table {$userTableName} n'existe pas, utilisation des données de test");
        $membres = $mockData;
        
        // Créer la table pour la prochaine utilisation
        error_log("Création de la table {$userTableName}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$userTableName}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `nom` VARCHAR(100) NOT NULL,
            `prenom` VARCHAR(100) NOT NULL,
            `email` VARCHAR(255) NULL,
            `telephone` VARCHAR(20) NULL,
            `fonction` VARCHAR(100) NULL,
            `organisation` VARCHAR(255) NULL,
            `notes` TEXT NULL,
            `initiales` VARCHAR(10) NULL,
            `userId` VARCHAR(50) NOT NULL,
            `mot_de_passe` VARCHAR(255) NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `last_sync_device` VARCHAR(100) NULL
        )");
        
        // Insérer les données de test
        $stmt = $pdo->prepare("INSERT INTO `{$userTableName}` 
                             (id, nom, prenom, fonction, initiales, email, telephone, userId, date_creation, last_sync_device) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        foreach ($mockData as $membre) {
            $stmt->execute([
                $membre['id'],
                $membre['nom'],
                $membre['prenom'],
                $membre['fonction'],
                $membre['initiales'],
                $membre['email'],
                $membre['telephone'],
                $userId,
                $membre['date_creation'],
                $deviceId
            ]);
        }
    }
    
    echo json_encode([
        'success' => true,
        'membres' => $membres,
        'count' => count($membres),
        'timestamp' => date('c'),
        'deviceId' => $deviceId
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans {$tableName}-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans {$tableName}-load.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($service)) {
        $service->finalize();
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE {$tableName}-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
