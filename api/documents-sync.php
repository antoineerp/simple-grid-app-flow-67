
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE documents-sync.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Configuration de la base de données (sans dépendre de env.php)
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les données POST JSON
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    error_log("Données reçues pour synchronisation des documents");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId']) || !isset($data['documents'])) {
        throw new Exception("Données incomplètes. 'userId' et 'documents' sont requis");
    }
    
    $userId = $data['userId'];
    $documents = $data['documents'];
    
    error_log("Synchronisation pour l'utilisateur: {$userId}");
    error_log("Nombre de documents: " . count($documents));
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Nom de la table spécifique à l'utilisateur
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tableName = "documents_" . $safeUserId;
    error_log("Table à utiliser: {$tableName}");
    
    // Créer la table si elle n'existe pas
    $createTableQuery = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `titre` VARCHAR(255) NOT NULL,
        `description` TEXT NULL,
        `url_fichier` VARCHAR(255) NULL,
        `type` VARCHAR(50) NULL,
        `tags` TEXT NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    error_log("Création de la table si nécessaire");
    $pdo->exec($createTableQuery);
    
    // Démarrer une transaction
    error_log("Début de la transaction");
    $pdo->beginTransaction();
    $transaction_active = true;
    
    try {
        // Vider la table avant d'insérer les nouvelles données
        $pdo->exec("TRUNCATE TABLE `{$tableName}`");
        error_log("Table vidée");
        
        // Insérer les documents
        if (count($documents) > 0) {
            $insertQuery = "INSERT INTO `{$tableName}` 
                (id, titre, description, url_fichier, type, tags, date_creation) 
                VALUES (:id, :titre, :description, :url_fichier, :type, :tags, :date_creation)";
            $stmt = $pdo->prepare($insertQuery);
            
            foreach ($documents as $document) {
                // Convertir la date au format SQL si nécessaire
                if (isset($document['date_creation']) && is_string($document['date_creation'])) {
                    $dateCreation = date('Y-m-d H:i:s', strtotime($document['date_creation']));
                } else {
                    $dateCreation = date('Y-m-d H:i:s');
                }
                
                // Convertir les tags en JSON si c'est un tableau
                $tags = isset($document['tags']) ? 
                    (is_array($document['tags']) ? json_encode($document['tags']) : $document['tags']) : 
                    NULL;
                
                $stmt->execute([
                    'id' => $document['id'],
                    'titre' => $document['titre'],
                    'description' => isset($document['description']) ? $document['description'] : NULL,
                    'url_fichier' => isset($document['url_fichier']) ? $document['url_fichier'] : NULL,
                    'type' => isset($document['type']) ? $document['type'] : NULL,
                    'tags' => $tags,
                    'date_creation' => $dateCreation
                ]);
            }
            error_log("Documents insérés: " . count($documents));
        }
        
        // Valider la transaction
        if ($transaction_active && $pdo->inTransaction()) {
            $pdo->commit();
            $transaction_active = false;
            error_log("Transaction validée");
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Synchronisation réussie',
            'count' => count($documents)
        ]);
        
    } catch (Exception $e) {
        // Annuler la transaction en cas d'erreur
        if ($transaction_active && $pdo->inTransaction()) {
            $pdo->rollBack();
            $transaction_active = false;
            error_log("Transaction annulée suite à une erreur");
        }
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans documents-sync.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans documents-sync.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // S'assurer que la transaction est terminée si elle est encore active
    if (isset($pdo) && isset($transaction_active) && $transaction_active && $pdo->inTransaction()) {
        try {
            error_log("Annulation de la transaction qui était encore active dans le bloc finally");
            $pdo->rollBack();
        } catch (Exception $e) {
            error_log("Erreur lors du rollback final: " . $e->getMessage());
        }
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE documents-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}
