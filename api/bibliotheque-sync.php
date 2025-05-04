
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/RequestHandler.php';
require_once 'services/DataSyncService.php';

// Nom de la table à synchroniser (pour l'enregistrement)
$tableName = 'bibliotheque';

// Créer le service de synchronisation uniquement pour l'historique
$service = new DataSyncService($tableName);

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("POST, OPTIONS");
RequestHandler::handleOptionsRequest();

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-sync.php (REDIRECTEUR) ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Récupérer le userId et deviceId pour l'historique avant la redirection
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if ($json && $data && isset($data['userId'])) {
        $userId = RequestHandler::sanitizeUserId($data['userId']);
        $deviceId = isset($data['deviceId']) ? $data['deviceId'] : RequestHandler::getDeviceId();
        
        // Connexion à la base de données et enregistrement dans l'historique
        if ($service->connectToDatabase()) {
            // Enregistrer cette redirecton dans l'historique
            $service->recordSyncOperation($userId, $deviceId, 'redirect-sync', 0);
            error_log("Redirection de bibliotheque-sync.php vers collaboration-sync.php enregistrée dans l'historique");
        }
    }
    
    // Redirection vers le nouveau endpoint
    error_log("bibliotheque-sync.php: Redirection vers collaboration-sync.php");
    include_once 'collaboration-sync.php';
} catch (Exception $e) {
    error_log("Erreur dans bibliotheque-sync.php: " . $e->getMessage());
    // Ne pas traiter l'erreur ici, laisser collaboration-sync.php s'en occuper
} finally {
    if (isset($service)) {
        $service->finalize();
    }
}
// Note: Pas besoin de terminer ce fichier car collaboration-sync.php s'en charge
?>
