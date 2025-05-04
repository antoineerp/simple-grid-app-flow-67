
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
RequestHandler::setStandardHeaders("GET, OPTIONS");
RequestHandler::handleOptionsRequest();

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-load.php (REDIRECTEUR) ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

try {
    // Récupérer le userId et deviceId pour l'historique avant la redirection
    if (isset($_GET['userId'])) {
        $userId = RequestHandler::sanitizeUserId($_GET['userId']);
        $deviceId = isset($_GET['deviceId']) ? $_GET['deviceId'] : RequestHandler::getDeviceId();
        
        // Connexion à la base de données et enregistrement dans l'historique
        if ($service->connectToDatabase()) {
            // Enregistrer cette redirecton dans l'historique
            $service->recordSyncOperation($userId, $deviceId, 'redirect-load', 0);
            error_log("Redirection de bibliotheque-load.php vers collaboration-load.php enregistrée dans l'historique");
        }
    }
    
    // Redirection vers le nouveau endpoint
    error_log("bibliotheque-load.php: Redirection vers collaboration-load.php");
    include_once 'collaboration-load.php';
} catch (Exception $e) {
    error_log("Erreur dans bibliotheque-load.php: " . $e->getMessage());
    // Ne pas traiter l'erreur ici, laisser collaboration-load.php s'en occuper
} finally {
    if (isset($service)) {
        $service->finalize();
    }
}
// Note: Pas besoin de terminer ce fichier car collaboration-load.php s'en charge
?>
