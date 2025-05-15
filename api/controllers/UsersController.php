<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

$baseDir = dirname(__DIR__);
require_once $baseDir . '/config/database.php';
require_once $baseDir . '/middleware/RequestHandler.php';
require_once $baseDir . '/utils/ResponseHandler.php';
require_once $baseDir . '/operations/UserOperations.php';

// Handle CORS and preflight requests
RequestHandler::handleCORS();

// Log request information for debugging
error_log("UsersController - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("UsersController - Données brutes: " . file_get_contents("php://input"));

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Initialize user operations
    $userOps = new UserOperations($db);

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $userOps->handleGetRequest();
            break;
            
        case 'POST':
            // Capturer les données brutes
            $postData = file_get_contents("php://input");
            error_log("UsersController - Données POST brutes: " . $postData);
            
            if (empty($postData)) {
                ResponseHandler::error("Aucune donnée reçue", 400);
                break;
            }
            
            // S'assurer que le JSON est valide
            $data = json_decode($postData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHandler::error("JSON invalide: " . json_last_error_msg(), 400);
                break;
            }
            
            // Log des données après décodage JSON pour debug
            error_log("UsersController - Données JSON décodées: " . json_encode($data));
            
            // Vérifier que les en-têtes de réponse sont correctement définis
            if (!headers_sent()) {
                header('Content-Type: application/json; charset=UTF-8');
            }
            
            // Appel à la méthode de traitement des requêtes POST
            $userOps->handlePostRequest();
            
            // Après la création d'un utilisateur, créer ses tables associées
            if (isset($data->identifiant_technique)) {
                $userId = $data->identifiant_technique;
                error_log("UsersController - Création des tables pour le nouvel utilisateur: " . $userId);
                
                // Créer les tables nécessaires
                createUserTables($db, $userId);
            }
            break;
            
        case 'PUT':
            $userOps->handlePutRequest();
            break;
            
        case 'DELETE':
            // Récupérer l'ID avant de supprimer l'utilisateur
            $deleteData = json_decode(file_get_contents("php://input"), true);
            $userId = null;
            
            if (isset($deleteData['id'])) {
                // Récupérer l'identifiant technique de l'utilisateur
                $stmt = $db->prepare("SELECT identifiant_technique FROM utilisateurs WHERE id = :id");
                $stmt->bindParam(':id', $deleteData['id']);
                $stmt->execute();
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($user && isset($user['identifiant_technique'])) {
                    $userId = $user['identifiant_technique'];
                    error_log("UsersController - Suppression des tables pour l'utilisateur: " . $userId);
                }
            }
            
            // Traiter la suppression
            $userOps->handleDeleteRequest();
            
            // Après la suppression, supprimer les tables associées
            if ($userId) {
                deleteUserTables($db, $userId);
            }
            break;
            
        default:
            ResponseHandler::error("Méthode non autorisée", 405);
            break;
    }
} catch (Exception $e) {
    error_log("UsersController - Exception: " . $e->getMessage() . " dans " . $e->getFile() . " à la ligne " . $e->getLine());
    
    // Nettoyer tout buffer de sortie existant
    if (ob_get_level()) {
        ob_clean();
    }
    
    // S'assurer que les en-têtes sont correctement définis
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
    }
    
    ResponseHandler::error(
        "Erreur serveur: " . $e->getMessage(),
        500,
        ["debug_info" => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()]
    );
}

/**
 * Crée les tables nécessaires pour un nouvel utilisateur
 */
function createUserTables($db, $userId) {
    try {
        // Sécuriser l'identifiant pour l'utiliser dans les noms de tables
        $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
        
        // Créer la table des membres
        $membresTable = "membres_" . $safeUserId;
        $db->exec("CREATE TABLE IF NOT EXISTS `{$membresTable}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `nom` VARCHAR(100) NOT NULL,
            `prenom` VARCHAR(100) NOT NULL,
            `fonction` VARCHAR(100),
            `initiales` VARCHAR(10),
            `mot_de_passe` VARCHAR(255),
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        error_log("Table {$membresTable} créée avec succès");
        
        // Créer d'autres tables nécessaires (documents, exigences, etc.)
        $documentsTable = "documents_" . $safeUserId;
        $db->exec("CREATE TABLE IF NOT EXISTS `{$documentsTable}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `link` VARCHAR(1024),
            `groupId` VARCHAR(36),
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        error_log("Table {$documentsTable} créée avec succès");
        
        $exigencesTable = "exigences_" . $safeUserId;
        $db->exec("CREATE TABLE IF NOT EXISTS `{$exigencesTable}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `nom` VARCHAR(255) NOT NULL,
            `responsabilites` JSON,
            `exclusion` BOOLEAN DEFAULT FALSE,
            `atteinte` ENUM('NC', 'PC', 'C') NULL,
            `groupId` VARCHAR(36),
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        
        error_log("Table {$exigencesTable} créée avec succès");
        
        // Copier les données du gestionnaire si disponible
        copyManagerDataIfAvailable($db, $userId);
        
        return true;
    } catch (PDOException $e) {
        error_log("Erreur lors de la création des tables pour l'utilisateur {$userId}: " . $e->getMessage());
        return false;
    }
}

/**
 * Supprime les tables associées à un utilisateur
 */
function deleteUserTables($db, $userId) {
    try {
        // Sécuriser l'identifiant pour l'utiliser dans les noms de tables
        $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
        
        // Liste des tables à supprimer
        $tables = [
            "membres_" . $safeUserId,
            "documents_" . $safeUserId,
            "exigences_" . $safeUserId,
            // Ajouter d'autres tables au besoin
        ];
        
        // Supprimer chaque table
        foreach ($tables as $table) {
            $db->exec("DROP TABLE IF EXISTS `{$table}`");
            error_log("Table {$table} supprimée avec succès");
        }
        
        return true;
    } catch (PDOException $e) {
        error_log("Erreur lors de la suppression des tables pour l'utilisateur {$userId}: " . $e->getMessage());
        return false;
    }
}

/**
 * Copie les données du gestionnaire vers un nouvel utilisateur
 */
function copyManagerDataIfAvailable($db, $targetUserId) {
    try {
        // Chercher d'abord un gestionnaire
        $stmt = $db->prepare("SELECT identifiant_technique FROM utilisateurs WHERE role = 'gestionnaire' LIMIT 1");
        $stmt->execute();
        $manager = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($manager) {
            // Si un gestionnaire existe, utiliser ses données
            $sourceUserId = $manager['identifiant_technique'];
            copyUserData($db, $sourceUserId, $targetUserId);
            error_log("Données copiées du gestionnaire {$sourceUserId} vers {$targetUserId}");
            return true;
        }
        
        // Si aucun gestionnaire trouvé, chercher un administrateur
        $stmt = $db->prepare("SELECT identifiant_technique FROM utilisateurs WHERE role IN ('admin', 'administrateur') LIMIT 1");
        $stmt->execute();
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            // Utiliser les données de l'administrateur
            $sourceUserId = $admin['identifiant_technique'];
            copyUserData($db, $sourceUserId, $targetUserId);
            error_log("Données copiées de l'administrateur {$sourceUserId} vers {$targetUserId}");
            return true;
        }
        
        error_log("Aucun gestionnaire ou administrateur trouvé pour la copie des données");
        return false;
    } catch (PDOException $e) {
        error_log("Erreur lors de la recherche d'un gestionnaire ou administrateur: " . $e->getMessage());
        return false;
    }
}

/**
 * Copie les données d'un utilisateur vers un autre
 */
function copyUserData($db, $sourceUserId, $targetUserId) {
    try {
        // Sécuriser les identifiants
        $safeSourceId = preg_replace('/[^a-zA-Z0-9_]/', '_', $sourceUserId);
        $safeTargetId = preg_replace('/[^a-zA-Z0-9_]/', '_', $targetUserId);
        
        // Copier les tables
        $tables = [
            "membres" => "membres_{$safeSourceId}",
            "documents" => "documents_{$safeSourceId}",
            "exigences" => "exigences_{$safeSourceId}"
        ];
        
        foreach ($tables as $type => $sourceTable) {
            $targetTable = str_replace($safeSourceId, $safeTargetId, $sourceTable);
            
            // Vérifier si la table source existe
            $stmt = $db->prepare("SHOW TABLES LIKE :table");
            $stmt->execute(['table' => $sourceTable]);
            
            if ($stmt->rowCount() > 0) {
                error_log("Copie de {$sourceTable} vers {$targetTable}");
                
                // S'assurer que la table cible existe
                $tableCreateQueries = [
                    "membres" => "CREATE TABLE IF NOT EXISTS `{$targetTable}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(100) NOT NULL,
                        `prenom` VARCHAR(100) NOT NULL,
                        `fonction` VARCHAR(100),
                        `initiales` VARCHAR(10),
                        `mot_de_passe` VARCHAR(255),
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
                    "documents" => "CREATE TABLE IF NOT EXISTS `{$targetTable}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `name` VARCHAR(255) NOT NULL,
                        `link` VARCHAR(1024),
                        `groupId` VARCHAR(36),
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
                    "exigences" => "CREATE TABLE IF NOT EXISTS `{$targetTable}` (
                        `id` VARCHAR(36) PRIMARY KEY,
                        `nom` VARCHAR(255) NOT NULL,
                        `responsabilites` JSON,
                        `exclusion` BOOLEAN DEFAULT FALSE,
                        `atteinte` ENUM('NC', 'PC', 'C') NULL,
                        `groupId` VARCHAR(36),
                        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
                ];
                
                if (isset($tableCreateQueries[$type])) {
                    $db->exec($tableCreateQueries[$type]);
                }
                
                // Vider la table cible avant d'y copier les données
                $db->exec("DELETE FROM `{$targetTable}`");
                
                // Copier les données
                $db->exec("INSERT INTO `{$targetTable}` SELECT * FROM `{$sourceTable}`");
                error_log("Données copiées avec succès de {$sourceTable} vers {$targetTable}");
            } else {
                error_log("Table source {$sourceTable} non trouvée, aucune copie effectuée");
            }
        }
        
        return true;
    } catch (PDOException $e) {
        error_log("Erreur lors de la copie des données: " . $e->getMessage());
        return false;
    }
}
?>
