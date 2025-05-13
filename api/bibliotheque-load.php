
<?php
// Force output buffering to prevent output before headers
ob_start();

// Initialiser la gestion de synchronisation
require_once 'services/RequestHandler.php';

// Définir les en-têtes standard
RequestHandler::setStandardHeaders("GET, OPTIONS");
RequestHandler::handleOptionsRequest();

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-load.php (REDIRECTEUR) ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Redirection vers le nouveau endpoint
error_log("bibliotheque-load.php: Redirection vers collaboration-load.php");
include_once 'collaboration-load.php';

// Note: Pas besoin de terminer ce fichier car collaboration-load.php s'en charge
?>
