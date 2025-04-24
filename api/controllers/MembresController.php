
<?php
if (!defined('DIRECT_ACCESS_CHECK')) {
    define('DIRECT_ACCESS_CHECK', true);
}

$baseDir = dirname(__DIR__);
require_once $baseDir . '/config/database.php';
require_once $baseDir . '/middleware/RequestHandler.php';
require_once $baseDir . '/utils/ResponseHandler.php';

// Handle CORS and preflight requests
RequestHandler::handleCORS();

// Log request information
error_log("MembresController - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection(true);
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données: " . ($database->connection_error ?? "Erreur inconnue"));
    }

    // Récupérer et décoder les données JSON
    $requestBody = file_get_contents("php://input");
    $data = json_decode($requestBody);

    // Handle request based on HTTP method
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Récupérer les membres pour un utilisateur spécifique
            if (isset($_GET['user_id'])) {
                getMembresForUser($db, $_GET['user_id']);
            } else {
                ResponseHandler::error("User ID requis", 400);
            }
            break;
            
        case 'POST':
            // Sauvegarder les membres pour un utilisateur
            if ($data && isset($data->user_id) && isset($data->membres)) {
                saveMembres($db, $data->user_id, $data->membres);
            } else {
                ResponseHandler::error("Données incomplètes", 400);
            }
            break;
            
        default:
            ResponseHandler::error("Méthode non autorisée", 405);
            break;
    }
} catch (Exception $e) {
    error_log("MembresController - Exception: " . $e->getMessage());
    ResponseHandler::error(
        "Erreur serveur: " . $e->getMessage(),
        500,
        ["debug_info" => get_class($e) . " à la ligne " . $e->getLine() . " dans " . $e->getFile()]
    );
}

/**
 * Récupère les membres pour un utilisateur spécifique
 */
function getMembresForUser($db, $userId) {
    try {
        // Vérifier si la table existe, sinon la créer
        createMembresTableIfNeeded($db);
        
        // Préparer la requête
        $query = "SELECT * FROM membres WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $membres = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $membres[] = $row;
        }
        
        ResponseHandler::success([
            'membres' => $membres
        ]);
    } catch (PDOException $e) {
        error_log("Erreur lors de la récupération des membres: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Sauvegarde les membres pour un utilisateur
 */
function saveMembres($db, $userId, $membres) {
    try {
        // Vérifier si la table existe, sinon la créer
        createMembresTableIfNeeded($db);
        
        // Commencer une transaction
        $db->beginTransaction();
        
        // Supprimer les membres existants pour cet utilisateur
        $deleteQuery = "DELETE FROM membres WHERE user_id = :user_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(':user_id', $userId);
        $deleteStmt->execute();
        
        // Insérer les nouveaux membres
        $insertQuery = "INSERT INTO membres (user_id, membre_id, nom, prenom, fonction, initiales, date_creation) 
                        VALUES (:user_id, :membre_id, :nom, :prenom, :fonction, :initiales, :date_creation)";
        $insertStmt = $db->prepare($insertQuery);
        
        foreach ($membres as $membre) {
            // Convertir la date au format SQL
            $date = new DateTime($membre->date_creation);
            $dateSQL = $date->format('Y-m-d H:i:s');
            
            $insertStmt->bindParam(':user_id', $userId);
            $insertStmt->bindParam(':membre_id', $membre->id);
            $insertStmt->bindParam(':nom', $membre->nom);
            $insertStmt->bindParam(':prenom', $membre->prenom);
            $insertStmt->bindParam(':fonction', $membre->fonction);
            $insertStmt->bindParam(':initiales', $membre->initiales);
            $insertStmt->bindParam(':date_creation', $dateSQL);
            $insertStmt->execute();
        }
        
        // Valider la transaction
        $db->commit();
        
        ResponseHandler::success([
            'message' => 'Membres sauvegardés avec succès',
            'count' => count($membres)
        ]);
    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log("Erreur lors de la sauvegarde des membres: " . $e->getMessage());
        throw $e;
    }
}

/**
 * Crée la table des membres si elle n'existe pas
 */
function createMembresTableIfNeeded($db) {
    try {
        $query = "
            CREATE TABLE IF NOT EXISTS `membres` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `user_id` varchar(255) NOT NULL,
                `membre_id` varchar(50) NOT NULL,
                `nom` varchar(100) NOT NULL,
                `prenom` varchar(100) NOT NULL,
                `fonction` varchar(100) DEFAULT NULL,
                `initiales` varchar(10) DEFAULT NULL,
                `date_creation` datetime NOT NULL,
                PRIMARY KEY (`id`),
                KEY `user_id` (`user_id`),
                KEY `membre_id` (`membre_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ";
        $db->exec($query);
    } catch (PDOException $e) {
        error_log("Erreur lors de la création de la table des membres: " . $e->getMessage());
        throw $e;
    }
}
?>
