
<?php
// Force output buffering to prevent output before headers
ob_start();

// Fichier pour charger les données de la bibliothèque depuis le serveur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-load.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
if (isset($_GET['userId'])) {
    error_log("UserId reçu: " . $_GET['userId']);
} else {
    error_log("UserId non fourni dans la requête");
}

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();

    // Vérifier si l'userId est présent
    $userId = '';
    if (isset($_GET['userId']) && !empty($_GET['userId'])) {
        $userId = $_GET['userId'];
    } else if (isset($_REQUEST['userId']) && !empty($_REQUEST['userId'])) {
        $userId = $_REQUEST['userId'];
    }
    
    if (empty($userId)) {
        // Pour les tests, fournir une valeur par défaut si userId est manquant
        $userId = 'p71x6d_system';
        error_log("UserId manquant, utilisation de la valeur par défaut: {$userId}");
    } else {
        error_log("Chargement des données pour l'utilisateur: {$userId}");
    }
    
    // Fonction pour formater le nom de la table en supprimant les caractères non autorisés
    function formatTableName($userId, $prefix) {
        // Remplacer les caractères non alphanumériques par des underscores
        $sanitized = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
        return $prefix . '_' . $sanitized;
    }
    
    // Tenter d'accéder à la base de données si les paramètres sont configurés
    try {
        $host = "p71x6d.myd.infomaniak.com";
        $dbname = "p71x6d_system";
        $username = "p71x6d_system";
        $password = "Trottinette43!";
        
        // Générer les noms de tables normalisés
        $documentsTable = formatTableName($userId, 'documents');
        $groupsTable = formatTableName($userId, 'groups');
        
        error_log("Table de documents: {$documentsTable}");
        error_log("Table de groupes: {$groupsTable}");
        
        $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        
        // Vérifier si les tables existent
        $tables = [];
        $stmt = $pdo->query("SHOW TABLES");
        while ($row = $stmt->fetch()) {
            $tables[] = reset($row);
        }
        
        $documents = [];
        $groups = [];
        
        // Si la table de documents existe, récupérer les données
        if (in_array($documentsTable, $tables)) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM `{$documentsTable}`");
                $stmt->execute();
                $documents = $stmt->fetchAll();
                error_log("Documents récupérés: " . count($documents));
            } catch (PDOException $e) {
                error_log("Erreur SQL (documents): " . $e->getMessage());
            }
        } else {
            error_log("Table de documents inexistante: {$documentsTable}");
            // Créer la table des documents
            try {
                $pdo->exec("CREATE TABLE IF NOT EXISTS `{$documentsTable}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `name` VARCHAR(255) NOT NULL,
                    `category` VARCHAR(100),
                    `path` VARCHAR(255),
                    `groupId` VARCHAR(36),
                    `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                error_log("Table des documents créée: {$documentsTable}");
            } catch (PDOException $e) {
                error_log("Erreur lors de la création de la table des documents: " . $e->getMessage());
            }
        }
        
        // Si la table de groupes existe, récupérer les données
        if (in_array($groupsTable, $tables)) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM `{$groupsTable}`");
                $stmt->execute();
                $groups = $stmt->fetchAll();
                error_log("Groupes récupérés: " . count($groups));
            } catch (PDOException $e) {
                error_log("Erreur SQL (groupes): " . $e->getMessage());
            }
        } else {
            error_log("Table de groupes inexistante: {$groupsTable}");
            // Créer la table des groupes
            try {
                $pdo->exec("CREATE TABLE IF NOT EXISTS `{$groupsTable}` (
                    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
                    `name` VARCHAR(255) NOT NULL,
                    `expanded` TINYINT(1) DEFAULT 0,
                    `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `date_modification` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                error_log("Table des groupes créée: {$groupsTable}");
            } catch (PDOException $e) {
                error_log("Erreur lors de la création de la table des groupes: " . $e->getMessage());
            }
        }
        
        echo json_encode([
            'success' => true,
            'documents' => $documents,
            'groups' => $groups,
            'count' => [
                'documents' => count($documents),
                'groups' => count($groups)
            ],
            'tables' => [
                'documents' => $documentsTable,
                'groups' => $groupsTable,
                'exists' => [
                    'documents' => in_array($documentsTable, $tables),
                    'groups' => in_array($groupsTable, $tables)
                ]
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Erreur PDO dans bibliotheque-load.php: " . $e->getMessage());
        error_log("Code d'erreur PDO: " . $e->getCode());
        
        // Renvoyer des données simulées en cas d'erreur de base de données
        echo json_encode([
            'success' => true,
            'documents' => [],
            'groups' => [],
            'count' => [
                'documents' => 0,
                'groups' => 0
            ],
            'error_info' => [
                'message' => 'Erreur de connexion à la base de données, utilisation de données simulées',
                'error' => $e->getMessage(),
                'code' => $e->getCode()
            ]
        ]);
    }
    
} catch (Exception $e) {
    error_log("Erreur dans bibliotheque-load.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE bibliotheque-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
