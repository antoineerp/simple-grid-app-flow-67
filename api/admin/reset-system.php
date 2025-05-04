
<?php
// Script de réinitialisation complète du système
// ATTENTION: Ce script supprime tous les utilisateurs et leurs tables associées

// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'appel
error_log("API reset-system.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Pour des raisons de sécurité, ce script nécessite un code de confirmation
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
    exit;
}

// S'assurer que toutes les sorties précédentes sont effacées
ob_clean();

// Récupérer et valider les données
$data = json_decode(file_get_contents("php://input"), true);
error_log("Données reçues: " . json_encode($data));

// Vérifier le code de confirmation
if (!isset($data['confirmationCode']) || $data['confirmationCode'] !== 'RESET_ALL_SYSTEM_2024') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Code de confirmation invalide ou manquant']);
    exit;
}

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

// Liste des préfixes de tables à surveiller et supprimer
$tablePrefixes = [
    'documents_',
    'exigences_',
    'membres_',
    'bibliotheque_',
    'collaboration_',
    'collaboration_groups_',
    'test_'
];

// Tables système à préserver (ne seront pas supprimées)
$systemTables = [
    'pma__',         // Tables phpMyAdmin
    'sync_history',  // Historique de synchronisation
];

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
    
    error_log("Tentative de connexion à la base de données pour réinitialisation");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion réussie pour la réinitialisation");
    
    // 1. Récupérer la liste des utilisateurs
    $stmt = $pdo->query("SELECT id, identifiant_technique, email FROM utilisateurs");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Nombre d'utilisateurs trouvés: " . count($users));
    
    $deletedUsers = [];
    $deletedTables = [];
    $errors = [];
    
    // 2. Récupérer toutes les tables de la base de données
    $tablesQuery = "SHOW TABLES";
    $stmt = $pdo->prepare($tablesQuery);
    $stmt->execute();
    $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    error_log("Nombre total de tables: " . count($allTables));
    
    // 3. Supprimer les tables spécifiques aux utilisateurs
    foreach ($allTables as $table) {
        // Vérifier si c'est une table système à préserver
        $isSystemTable = false;
        foreach ($systemTables as $sysPrefix) {
            if (strpos($table, $sysPrefix) === 0) {
                $isSystemTable = true;
                break;
            }
        }
        
        if ($isSystemTable) {
            continue; // Ne pas supprimer les tables système
        }
        
        // Vérifier si c'est une table d'utilisateur
        $isUserTable = false;
        foreach ($tablePrefixes as $prefix) {
            if (strpos($table, $prefix) === 0) {
                $isUserTable = true;
                break;
            }
        }
        
        if ($isUserTable) {
            try {
                $dropQuery = "DROP TABLE IF EXISTS `{$table}`";
                $pdo->exec($dropQuery);
                $deletedTables[] = $table;
                error_log("Table supprimée: {$table}");
            } catch (PDOException $e) {
                $errorMessage = "Erreur lors de la suppression de la table {$table}: " . $e->getMessage();
                error_log($errorMessage);
                $errors[] = $errorMessage;
            }
        }
    }
    
    // 4. Vider la table des utilisateurs
    try {
        $pdo->exec("DELETE FROM utilisateurs");
        error_log("Table utilisateurs vidée");
    } catch (PDOException $e) {
        $errorMessage = "Erreur lors de la suppression des utilisateurs: " . $e->getMessage();
        error_log($errorMessage);
        $errors[] = $errorMessage;
        
        // Si la troncature échoue, essayer de supprimer les enregistrements un par un
        try {
            $pdo->exec("DELETE FROM utilisateurs");
            error_log("Table utilisateurs vidée par DELETE");
        } catch (PDOException $e2) {
            $errorMessage = "Échec secondaire de suppression des utilisateurs: " . $e2->getMessage();
            error_log($errorMessage);
            $errors[] = $errorMessage;
        }
    }
    
    // 5. Créer l'utilisateur antcirier@gmail.com avec le mot de passe spécifié
    $email = 'antcirier@gmail.com';
    $password = 'Trottinette43!';
    $identifiantTechnique = 'p71x6d_cirier_antoine_' . substr(uniqid(), 0, 8) . '_' . time();
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $insertUserQuery = "INSERT INTO utilisateurs 
        (id, nom, prenom, email, mot_de_passe, identifiant_technique, role, date_creation) 
        VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())";
    $stmt = $pdo->prepare($insertUserQuery);
    $stmt->execute(['Cirier', 'Antoine', $email, $hashedPassword, $identifiantTechnique, 'admin']);
    
    $userId = $pdo->lastInsertId();
    error_log("Utilisateur créé avec ID: {$userId}, identifiant technique: {$identifiantTechnique}");
    
    // 6. Créer les tables pour le nouvel utilisateur
    $createdTables = [];
    
    // Initialisation des tables pour l'utilisateur
    $baseTables = [
        'documents' => "CREATE TABLE IF NOT EXISTS `documents_{$identifiantTechnique}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `titre` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `contenu` LONGTEXT NULL,
            `type` VARCHAR(50) NULL,
            `statut` VARCHAR(50) DEFAULT 'brouillon',
            `reference` VARCHAR(100) NULL,
            `userId` VARCHAR(50) NOT NULL,
            `groupId` VARCHAR(36) NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        
        'membres' => "CREATE TABLE IF NOT EXISTS `membres_{$identifiantTechnique}` (
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
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        
        'exigences' => "CREATE TABLE IF NOT EXISTS `exigences_{$identifiantTechnique}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `numero` VARCHAR(50) NOT NULL,
            `description` TEXT NOT NULL,
            `indicateur` TEXT NULL,
            `niveau` VARCHAR(50) NULL,
            `statut` VARCHAR(50) DEFAULT 'à traiter',
            `proprietaire` VARCHAR(100) NULL,
            `userId` VARCHAR(50) NOT NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        
        'bibliotheque' => "CREATE TABLE IF NOT EXISTS `bibliotheque_{$identifiantTechnique}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `titre` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `type_document` VARCHAR(50) NULL,
            `chemin_fichier` VARCHAR(255) NULL,
            `tags` TEXT NULL,
            `userId` VARCHAR(50) NOT NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        
        'collaboration' => "CREATE TABLE IF NOT EXISTS `collaboration_{$identifiantTechnique}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `titre` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `type_document` VARCHAR(50) NULL,
            `chemin_fichier` VARCHAR(255) NULL,
            `tags` TEXT NULL,
            `userId` VARCHAR(50) NOT NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    ];
    
    foreach ($baseTables as $baseTable => $createStatement) {
        try {
            $pdo->exec($createStatement);
            $tableName = "{$baseTable}_{$identifiantTechnique}";
            $createdTables[] = $tableName;
            error_log("Table créée: {$tableName}");
            
            // Activer le suivi de la table dans PHPMyAdmin
            try {
                $pdo->exec("INSERT IGNORE INTO `pma__tracking` 
                          (db_name, table_name, version, date_created, date_updated, schema_snapshot, schema_sql, data_sql, tracking)
                          VALUES 
                          ('p71x6d_system', '{$tableName}', '1', NOW(), NOW(), '', '', '', 'UPDATE,INSERT,DELETE')");
            } catch (Exception $e) {
                error_log("Impossible d'activer le suivi pour {$tableName}: " . $e->getMessage());
            }
        } catch (PDOException $e) {
            $errorMessage = "Erreur lors de la création de la table {$baseTable}_{$identifiantTechnique}: " . $e->getMessage();
            error_log($errorMessage);
            $errors[] = $errorMessage;
        }
    }
    
    // 7. Insérer des enregistrements dans l'historique de synchronisation
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
            INDEX `idx_user_device` (`user_id`, `device_id`),
            INDEX `idx_table_user` (`table_name`, `user_id`),
            INDEX `idx_timestamp` (`sync_timestamp`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        // Insérer des enregistrements d'initialisation pour chaque table
        $deviceId = 'system_reset_' . time();
        
        foreach ($baseTables as $baseTable => $createStatement) {
            $stmt = $pdo->prepare("INSERT INTO `sync_history` 
                                (table_name, user_id, device_id, record_count, operation) 
                                VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$baseTable, $identifiantTechnique, $deviceId, 0, 'initialize']);
            $stmt->execute([$baseTable, $identifiantTechnique, $deviceId, 0, 'load']);
            $stmt->execute([$baseTable, $identifiantTechnique, $deviceId, 0, 'sync']);
        }
        
        error_log("Historique de synchronisation initialisé pour l'utilisateur");
        
    } catch (PDOException $e) {
        $errorMessage = "Erreur lors de l'initialisation de l'historique de synchronisation: " . $e->getMessage();
        error_log($errorMessage);
        $errors[] = $errorMessage;
    }
    
    // S'assurer qu'il n'y a pas d'autre sortie avant la réponse JSON
    ob_clean();
    
    // Préparer la réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Réinitialisation du système terminée',
        'details' => [
            'newUser' => [
                'email' => $email,
                'identifiant_technique' => $identifiantTechnique
            ],
            'tablesDeleted' => count($deletedTables),
            'tablesCreated' => count($createdTables),
            'errors' => $errors
        ]
    ]);
    exit;
    
} catch (PDOException $e) {
    error_log("Erreur PDO lors de la réinitialisation: " . $e->getMessage());
    
    // S'assurer qu'il n'y a pas d'autre sortie avant la réponse JSON
    ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Erreur générale lors de la réinitialisation: " . $e->getMessage());
    
    // S'assurer qu'il n'y a pas d'autre sortie avant la réponse JSON
    ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
    exit;
}
?>
