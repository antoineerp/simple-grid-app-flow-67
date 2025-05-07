
<?php
// Force output buffering to prevent output before headers
ob_start();

// Fichier pour gérer la synchronisation des données de pilotage
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journalisation
error_log("API pilotage-sync.php - Méthode: " . $_SERVER['REQUEST_METHOD']);

// Configuration de la base de données
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
    
    error_log("Données de synchronisation pilotage reçues: " . substr(json_encode($data), 0, 500) . "...");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId']) || !isset($data['documents'])) {
        throw new Exception("Données incomplètes. 'userId' et 'documents' sont requis");
    }
    
    $userId = $data['userId'];
    $documents = $data['documents'];
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    // Vérifier si la table de synchronisation existe
    $tableName = "pilotage_" . preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    
    // Créer la table si elle n'existe pas
    $pdo->exec("CREATE TABLE IF NOT EXISTS `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(255) NOT NULL,
        `fichier_path` VARCHAR(255) NULL,
        `responsabilites` TEXT NULL,
        `etat` VARCHAR(10) NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    
    // Commencer une transaction
    $pdo->beginTransaction();
    
    try {
        // Vider la table avant d'insérer les données actualisées
        $pdo->exec("TRUNCATE TABLE `{$tableName}`");
        
        // Préparer la requête d'insertion
        $stmt = $pdo->prepare("INSERT INTO `{$tableName}` 
            (id, nom, fichier_path, responsabilites, etat, date_creation, date_modification)
            VALUES (:id, :nom, :fichier_path, :responsabilites, :etat, :date_creation, :date_modification)");
        
        // Insérer chaque document
        foreach ($documents as $document) {
            // S'assurer que l'id existe
            if (!isset($document['id']) || empty($document['id'])) {
                continue; // Sauter cet enregistrement
            }
            
            // Préparer les données
            $id = $document['id'];
            $nom = $document['nom'] ?? '';
            $fichier_path = $document['fichier_path'] ?? null;
            $responsabilites = isset($document['responsabilites']) ? json_encode($document['responsabilites']) : null;
            $etat = $document['etat'] ?? null;
            
            // Convertir les dates au format SQL
            $dateCreation = isset($document['date_creation']) 
                ? (is_string($document['date_creation']) 
                    ? $document['date_creation'] 
                    : date('Y-m-d H:i:s', $document['date_creation']['seconds'] ?? time()))
                : date('Y-m-d H:i:s');
                
            $dateModification = isset($document['date_modification']) 
                ? (is_string($document['date_modification']) 
                    ? $document['date_modification'] 
                    : date('Y-m-d H:i:s', $document['date_modification']['seconds'] ?? time()))
                : date('Y-m-d H:i:s');
            
            // Exécuter l'insertion
            $stmt->execute([
                'id' => $id,
                'nom' => $nom,
                'fichier_path' => $fichier_path,
                'responsabilites' => $responsabilites,
                'etat' => $etat,
                'date_creation' => $dateCreation,
                'date_modification' => $dateModification
            ]);
        }
        
        // Valider la transaction
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Synchronisation des documents de pilotage réussie',
            'count' => count($documents)
        ]);
        
    } catch (Exception $e) {
        // Annuler la transaction en cas d'erreur
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans pilotage-sync.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans pilotage-sync.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (ob_get_level()) ob_end_flush();
}
?>
