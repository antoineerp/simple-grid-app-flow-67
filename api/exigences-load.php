
<?php
// Force output buffering to prevent output before headers
ob_start();

// Fichier pour charger les données des exigences depuis le serveur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE exigences-load.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Vérifier si l'userId est présent
    if (!isset($_GET['userId']) || empty($_GET['userId'])) {
        throw new Exception("Paramètre 'userId' manquant");
    }
    
    $userId = $_GET['userId'];
    error_log("Chargement des exigences pour l'utilisateur: {$userId}");
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Nom des tables spécifiques à l'utilisateur
    $exigencesTableName = "exigences_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $groupsTableName = "exigence_groups_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    error_log("Tables à consulter: {$exigencesTableName}, {$groupsTableName}");
    
    // Vérifier si les tables existent
    $exigencesTableExists = false;
    $groupsTableExists = false;
    
    $tableExistsQuery = "SHOW TABLES LIKE :tableName";
    $stmt = $pdo->prepare($tableExistsQuery);
    
    // Vérifier la table des exigences
    $stmt->execute(['tableName' => $exigencesTableName]);
    $exigencesTableExists = $stmt->rowCount() > 0;
    
    // Vérifier la table des groupes
    $stmt->execute(['tableName' => $groupsTableName]);
    $groupsTableExists = $stmt->rowCount() > 0;
    
    // Initialiser les résultats
    $exigences = [];
    $groups = [];
    
    // Récupérer les exigences si la table existe
    if ($exigencesTableExists) {
        $query = "SELECT * FROM `" . $exigencesTableName . "` ORDER BY id";
        error_log("Exécution de la requête: {$query}");
        $stmt = $pdo->query($query);
        $exigences = $stmt->fetchAll();
        
        // Formater les données pour le client
        foreach ($exigences as &$exigence) {
            // Convertir les dates
            if (isset($exigence['date_creation']) && $exigence['date_creation']) {
                $exigence['date_creation'] = date('Y-m-d\TH:i:s', strtotime($exigence['date_creation']));
            }
            if (isset($exigence['date_modification']) && $exigence['date_modification']) {
                $exigence['date_modification'] = date('Y-m-d\TH:i:s', strtotime($exigence['date_modification']));
            }
            
            // Convertir les responsabilités stockées en JSON
            if (isset($exigence['responsabilites']) && $exigence['responsabilites']) {
                $exigence['responsabilites'] = json_decode($exigence['responsabilites'], true);
            } else {
                $exigence['responsabilites'] = [
                    'r' => [],
                    'a' => [],
                    'c' => [],
                    'i' => []
                ];
            }
            
            // Convertir les booléens
            if (isset($exigence['exclusion'])) {
                $exigence['exclusion'] = (bool)$exigence['exclusion'];
            }
        }
    } else {
        // Créer la table si elle n'existe pas
        $createExigencesTable = "CREATE TABLE IF NOT EXISTS `" . $exigencesTableName . "` (
            `id` VARCHAR(36) NOT NULL PRIMARY KEY,
            `nom` VARCHAR(255) NOT NULL,
            `responsabilites` TEXT,
            `exclusion` TINYINT(1) DEFAULT 0,
            `atteinte` ENUM('NC', 'PC', 'C') NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            `groupId` VARCHAR(36) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createExigencesTable);
        error_log("Table {$exigencesTableName} créée");
    }
    
    // Récupérer les groupes si la table existe
    if ($groupsTableExists) {
        $query = "SELECT * FROM `" . $groupsTableName . "` ORDER BY id";
        error_log("Exécution de la requête: {$query}");
        $stmt = $pdo->query($query);
        $groups = $stmt->fetchAll();
        
        // Formater les données pour le client
        foreach ($groups as &$group) {
            // Convertir les booléens
            if (isset($group['expanded'])) {
                $group['expanded'] = (bool)$group['expanded'];
            }
        }
    } else {
        // Créer la table si elle n'existe pas
        $createGroupsTable = "CREATE TABLE IF NOT EXISTS `" . $groupsTableName . "` (
            `id` VARCHAR(36) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `expanded` TINYINT(1) DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createGroupsTable);
        error_log("Table {$groupsTableName} créée");
    }
    
    error_log("Exigences récupérées: " . count($exigences) . ", Groupes récupérés: " . count($groups));
    echo json_encode([
        'success' => true,
        'exigences' => $exigences,
        'groups' => $groups,
        'count' => [
            'exigences' => count($exigences),
            'groups' => count($groups)
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans exigences-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans exigences-load.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE exigences-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
