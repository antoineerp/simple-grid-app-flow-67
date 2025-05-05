
<?php
require_once 'services/DataSyncService.php';

// Initialiser le service
$service = new DataSyncService('membres');
$service->setStandardHeaders("POST, OPTIONS");
$service->handleOptionsRequest();

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. Utilisez POST.']);
    $service->finalize();
    exit;
}

try {
    // Récupérer les données POST
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$json || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    if (!isset($data['userId']) || !isset($data['membres'])) {
        throw new Exception("Données incomplètes. 'userId' et 'membres' sont requis");
    }
    
    $userId = $service->sanitizeUserId($data['userId']);
    $membres = $data['membres'];
    
    // Journaliser les données reçues pour le débogage
    error_log("Données de membres reçues: " . json_encode(array_slice($membres, 0, 2)));
    
    // Connecter à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Schéma de la table membres - Mise à jour pour inclure userId
    $schema = "CREATE TABLE IF NOT EXISTS `membres_{$userId}` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    // Créer la table si nécessaire
    if (!$service->ensureTableExists($schema)) {
        throw new Exception("Impossible de créer ou vérifier la table");
    }
    
    // Avant la synchronisation, vérifier et adapter les données si nécessaire
    foreach ($membres as &$membre) {
        // S'assurer que tous les champs nécessaires sont présents
        if (!isset($membre['id']) || empty($membre['id'])) {
            $membre['id'] = 'mem-' . bin2hex(random_bytes(8));
        }
        
        // Ajouter l'userId à chaque membre
        if (!isset($membre['userId']) || empty($membre['userId'])) {
            $membre['userId'] = $userId;
        }
        
        // Convertir les dates si nécessaires
        if (isset($membre['date_creation']) && $membre['date_creation'] instanceof \DateTime) {
            $membre['date_creation'] = $membre['date_creation']->format('Y-m-d\TH:i:s');
        }
        
        // Générer les initiales si elles ne sont pas définies
        if ((!isset($membre['initiales']) || empty($membre['initiales'])) && isset($membre['prenom']) && isset($membre['nom'])) {
            $membre['initiales'] = strtoupper(substr($membre['prenom'], 0, 1) . substr($membre['nom'], 0, 1));
        }
    }
    
    // Démarrer une transaction explicite
    $service->beginTransaction();
    
    try {
        // Synchroniser les données
        $service->syncData($membres);
        
        // Valider la transaction
        $service->commitTransaction();
        
        // Réponse réussie
        echo json_encode([
            'success' => true,
            'message' => 'Synchronisation des membres réussie',
            'count' => count($membres)
        ]);
        
    } catch (Exception $innerEx) {
        // Annuler la transaction en cas d'erreur
        $service->rollbackTransaction();
        throw $innerEx;
    }
    
} catch (Exception $e) {
    error_log("Erreur dans membres-sync.php: " . $e->getMessage());
    
    // S'assurer que tout buffer de sortie est nettoyé
    if (ob_get_level()) {
        ob_clean();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
} finally {
    $service->finalize();
}
?>
