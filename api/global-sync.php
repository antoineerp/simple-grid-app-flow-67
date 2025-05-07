
<?php
// Inclure la configuration de base
require_once __DIR__ . '/config/index.php';

// Configuration des headers
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

try {
    // Inclure la base de données si elle existe
    if (file_exists(__DIR__ . '/config/database.php')) {
        require_once __DIR__ . '/config/database.php';
    }

    // Vérifier l'authentification si le middleware Auth existe
    if (file_exists(__DIR__ . '/middleware/Auth.php')) {
        include_once __DIR__ . '/middleware/Auth.php';
        
        $allHeaders = getallheaders();
        
        if (class_exists('Auth')) {
            $auth = new Auth($allHeaders);
            $userData = $auth->isAuth();
            
            if (!$userData) {
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "Non autorisé"]);
                exit;
            }
        }
    }

    // S'assurer que la méthode est POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
        exit;
    }

    // Récupérer et décoder les données JSON envoyées
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Format JSON invalide"]);
        exit;
    }

    // Vérifier les données reçues
    if (!isset($input['userId']) || !isset($input['data'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Données incomplètes"]);
        exit;
    }

    $userId = $input['userId'];
    $data = $input['data'];
    
    // Connexion à la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Démarrer une transaction pour s'assurer que toutes les opérations sont atomiques
    $pdo->beginTransaction();
    
    try {
        // Synchroniser les documents de pilotage
        if (isset($data['pilotageDocuments'])) {
            $tableName = "pilotage_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            syncTable($pdo, $tableName, $data['pilotageDocuments']);
        }
        
        // Synchroniser les membres
        if (isset($data['membres'])) {
            $tableName = "membres_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            syncTable($pdo, $tableName, $data['membres']);
        }
        
        // Synchroniser les documents
        if (isset($data['documents'])) {
            $tableName = "documents_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            syncTable($pdo, $tableName, $data['documents']);
        }
        
        // Synchroniser les exigences
        if (isset($data['exigences'])) {
            $tableName = "exigences_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            syncTable($pdo, $tableName, $data['exigences']);
        }
        
        // Synchroniser la bibliothèque
        if (isset($data['bibliotheque'])) {
            $docsTableName = "biblio_docs_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            $groupsTableName = "biblio_groups_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
            
            if (isset($data['bibliotheque']['documents'])) {
                syncTable($pdo, $docsTableName, $data['bibliotheque']['documents']);
            }
            
            if (isset($data['bibliotheque']['groups'])) {
                syncTable($pdo, $groupsTableName, $data['bibliotheque']['groups']);
            }
        }
        
        // Valider la transaction
        $pdo->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Synchronisation globale réussie"
        ]);
        
    } catch (Exception $e) {
        // En cas d'erreur, annuler toutes les modifications
        $pdo->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    // Gérer les erreurs
    error_log("Erreur dans global-sync.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur serveur: " . $e->getMessage()]);
}

/**
 * Fonction pour synchroniser une table avec les données fournies
 */
function syncTable($pdo, $tableName, $items) {
    // Vérifier si la table existe
    $stmt = $pdo->prepare("SHOW TABLES LIKE :tableName");
    $stmt->execute(['tableName' => $tableName]);
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        // Créer la table en fonction du préfixe
        if (strpos($tableName, 'membres_') === 0) {
            createMembresTable($pdo, $tableName);
        } elseif (strpos($tableName, 'documents_') === 0 || strpos($tableName, 'pilotage_') === 0) {
            createDocumentsTable($pdo, $tableName);
        } elseif (strpos($tableName, 'exigences_') === 0) {
            createExigencesTable($pdo, $tableName);
        } elseif (strpos($tableName, 'biblio_docs_') === 0) {
            createBiblioDocsTable($pdo, $tableName);
        } elseif (strpos($tableName, 'biblio_groups_') === 0) {
            createBiblioGroupsTable($pdo, $tableName);
        }
    }
    
    // Vider la table avant d'insérer les nouvelles données
    $pdo->exec("TRUNCATE TABLE `{$tableName}`");
    
    // Insérer les données
    foreach ($items as $item) {
        insertItem($pdo, $tableName, $item);
    }
}

/**
 * Fonction pour créer la table des membres
 */
function createMembresTable($pdo, $tableName) {
    $pdo->exec("CREATE TABLE `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(100) NOT NULL,
        `prenom` VARCHAR(100) NOT NULL,
        `fonction` VARCHAR(100),
        `initiales` VARCHAR(10),
        `mot_de_passe` VARCHAR(255),
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

/**
 * Fonction pour créer la table des documents
 */
function createDocumentsTable($pdo, $tableName) {
    $pdo->exec("CREATE TABLE `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(255) NOT NULL,
        `ordre` INT,
        `lien` VARCHAR(512),
        `fichier_path` VARCHAR(512),
        `responsabilites` TEXT,
        `etat` ENUM('NC', 'PC', 'C', 'EX'),
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

/**
 * Fonction pour créer la table des exigences
 */
function createExigencesTable($pdo, $tableName) {
    $pdo->exec("CREATE TABLE `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `numero` VARCHAR(50) NOT NULL,
        `description` TEXT,
        `section` VARCHAR(255),
        `exclusion` BOOLEAN DEFAULT FALSE,
        `justification` TEXT,
        `atteinte` ENUM('NC', 'PC', 'C'),
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

/**
 * Fonction pour créer la table des documents de la bibliothèque
 */
function createBiblioDocsTable($pdo, $tableName) {
    $pdo->exec("CREATE TABLE `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `link` VARCHAR(512),
        `groupId` VARCHAR(36),
        `ordre` INT,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

/**
 * Fonction pour créer la table des groupes de la bibliothèque
 */
function createBiblioGroupsTable($pdo, $tableName) {
    $pdo->exec("CREATE TABLE `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `expanded` BOOLEAN DEFAULT FALSE,
        `ordre` INT,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

/**
 * Fonction pour insérer un élément dans une table
 */
function insertItem($pdo, $tableName, $item) {
    // Déterminer les colonnes disponibles dans la table
    $stmt = $pdo->query("DESCRIBE `{$tableName}`");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Créer un tableau de valeurs à insérer en fonction des colonnes disponibles
    $values = [];
    $placeholders = [];
    
    foreach ($columns as $column) {
        if (isset($item[$column])) {
            $value = $item[$column];
            
            // Traitement spécial pour certaines colonnes
            if ($column === 'responsabilites' && is_array($value)) {
                $value = json_encode($value);
            } elseif (($column === 'date_creation' || $column === 'date_modification') && is_string($value)) {
                $value = date('Y-m-d H:i:s', strtotime($value));
            }
            
            $values[$column] = $value;
            $placeholders[] = ":{$column}";
        } else {
            // Pour les colonnes manquantes, utiliser NULL (sauf pour les colonnes qui ont des valeurs par défaut)
            if (!in_array($column, ['date_creation', 'date_modification'])) {
                $values[$column] = null;
                $placeholders[] = ":{$column}";
            }
        }
    }
    
    // Construire la requête d'insertion
    $columnNames = implode(", ", array_keys($values));
    $placeholderStr = implode(", ", $placeholders);
    
    $query = "INSERT INTO `{$tableName}` ({$columnNames}) VALUES ({$placeholderStr})";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
}
?>
