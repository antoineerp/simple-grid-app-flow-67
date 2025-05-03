
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE membres-load.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer l'ID utilisateur et appareil depuis les paramètres GET
    $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
    $deviceId = isset($_GET['deviceId']) ? $_GET['deviceId'] : 'unknown';
    
    if (!$userId) {
        throw new Exception("ID utilisateur manquant");
    }
    error_log("UserId reçu: " . $userId . ", DeviceId: " . $deviceId);
    
    // Configuration de la connexion à la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
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
    
    // Essayer de se connecter à la base de données
    try {
        $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        error_log("Connexion à la base de données réussie");
        
        // Si la connexion à la base de données est réussie, essayer de récupérer les données
        try {
            $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            $tableName = "membres_{$safeUserId}";
            
            // Vérifier si la table existe
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.tables 
                                   WHERE table_schema = ? AND table_name = ?");
            $stmt->execute([$dbname, $tableName]);
            $tableExists = (int)$stmt->fetchColumn() > 0;
            
            // Vérifier si des synchronisations récentes ont été faites par d'autres appareils
            $hasRecentSyncs = false;
            if ($tableExists) {
                try {
                    // Vérifier la table d'historique de synchronisation
                    $syncCheckStmt = $pdo->prepare("SELECT COUNT(*) FROM sync_history 
                                                  WHERE user_id = ? AND device_id != ? 
                                                  AND table_name = 'membres'
                                                  AND sync_timestamp > DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
                    $syncCheckStmt->execute([$userId, $deviceId]);
                    $recentSyncs = (int)$syncCheckStmt->fetchColumn();
                    
                    if ($recentSyncs > 0) {
                        error_log("Des synchronisations récentes détectées depuis d'autres appareils: {$recentSyncs}");
                        $hasRecentSyncs = true;
                    }
                } catch (Exception $syncCheckErr) {
                    error_log("Erreur lors de la vérification des synchronisations récentes: " . $syncCheckErr->getMessage());
                    // Continuer malgré l'erreur
                }
            }
            
            if ($tableExists) {
                // La table existe, récupérer les données
                error_log("Table {$tableName} existe, récupération des données");
                
                // Vérifier si la colonne last_sync_device existe
                $columnsResult = $pdo->query("SHOW COLUMNS FROM `{$tableName}` LIKE 'last_sync_device'");
                $hasLastSyncColumn = $columnsResult->rowCount() > 0;
                
                if (!$hasLastSyncColumn) {
                    // Ajouter la colonne si elle n'existe pas
                    $pdo->exec("ALTER TABLE `{$tableName}` ADD COLUMN `last_sync_device` VARCHAR(100) NULL");
                    error_log("Colonne last_sync_device ajoutée à {$tableName}");
                }
                
                $stmt = $pdo->prepare("SELECT * FROM `{$tableName}`");
                $stmt->execute();
                $membres = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Si aucun membre trouvé, utiliser les données de test
                if (empty($membres)) {
                    error_log("Aucun membre trouvé dans la table, utilisation des données de test");
                    $membres = $mockData;
                } else {
                    error_log("Nombre de membres récupérés: " . count($membres));
                    // S'assurer que chaque membre a un userId
                    foreach ($membres as &$membre) {
                        if (!isset($membre['userId'])) {
                            $membre['userId'] = $userId;
                        }
                    }
                }
                
                // Enregistrer ce chargement dans l'historique de synchronisation
                try {
                    // Créer la table si elle n'existe pas
                    $pdo->exec("CREATE TABLE IF NOT EXISTS `sync_history` (
                        `id` INT AUTO_INCREMENT PRIMARY KEY,
                        `table_name` VARCHAR(100) NOT NULL,
                        `user_id` VARCHAR(50) NOT NULL,
                        `device_id` VARCHAR(100) NOT NULL,
                        `record_count` INT NOT NULL,
                        `sync_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `operation` VARCHAR(20) NOT NULL DEFAULT 'load',
                        INDEX `idx_user_device` (`user_id`, `device_id`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
                    
                    // Insérer dans l'historique
                    $historyStmt = $pdo->prepare("INSERT INTO `sync_history` 
                                                (table_name, user_id, device_id, record_count, operation) 
                                                VALUES ('membres', ?, ?, ?, 'load')");
                    $historyStmt->execute([$userId, $deviceId, count($membres)]);
                    
                } catch (Exception $historyErr) {
                    error_log("Erreur lors de l'enregistrement de l'historique de chargement: " . $historyErr->getMessage());
                    // Continuer malgré l'erreur
                }
                
            } else {
                error_log("Table {$tableName} n'existe pas, utilisation des données de test");
                $membres = $mockData;
                
                // Créer la table pour la prochaine utilisation
                error_log("Création de la table {$tableName}");
                $pdo->exec("CREATE TABLE IF NOT EXISTS `{$tableName}` (
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
                    `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    `last_sync_device` VARCHAR(100) NULL
                )");
                
                // Insérer les données de test
                $stmt = $pdo->prepare("INSERT INTO `{$tableName}` 
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
            
            // Préparer la réponse
            $response = [
                'success' => true,
                'records' => $membres,
                'hasRecentSyncs' => $hasRecentSyncs,
                'timestamp' => date('c')
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des données: " . $e->getMessage());
            // En cas d'erreur, utiliser les données de test
            $response = [
                'success' => true,
                'records' => $mockData,
                'error' => "Error fetching from database: " . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    } catch (PDOException $e) {
        error_log("Erreur de connexion à la base de données: " . $e->getMessage());
        // En cas d'échec de connexion, utiliser les données de test
        $response = [
            'success' => true,
            'records' => $mockData,
            'error' => "Database connection failed: " . $e->getMessage(),
            'timestamp' => date('c')
        ];
    }
    
    http_response_code(200);
    echo json_encode($response);
    error_log("Réponse de membres-load.php : " . json_encode($response));
    
} catch (Exception $e) {
    error_log("Exception dans membres-load.php: " . $e->getMessage());
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur: " . json_encode($errorResponse));
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE membres-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
?>
