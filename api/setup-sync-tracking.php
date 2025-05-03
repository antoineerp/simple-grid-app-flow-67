
<?php
/**
 * Ce script crée la table de suivi des synchronisations si elle n'existe pas déjà
 */

// Activer la journalisation d'erreurs
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/setup_errors.log');

// Définir les en-têtes pour éviter les problèmes CORS
header('Content-Type: application/json; charset=UTF-8');

// Charger la configuration de la base de données
require_once __DIR__ . '/config/database.php';

try {
    // Se connecter à la base de données
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$database->is_connected) {
        throw new Exception("Erreur de connexion à la base de données");
    }
    
    // Définir le schéma de la table de suivi des synchronisations
    $syncTrackingSchema = "
    CREATE TABLE IF NOT EXISTS `sync_tracking` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `user_id` varchar(100) NOT NULL,
      `device_id` varchar(100) NOT NULL,
      `table_name` varchar(100) NOT NULL,
      `last_sync` datetime NOT NULL,
      `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      KEY `idx_user_device_table` (`user_id`, `device_id`, `table_name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    
    // Exécuter la requête pour créer la table
    $db->exec($syncTrackingSchema);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Table de suivi des synchronisations créée ou vérifiée avec succès'
    ]);
    
} catch (Exception $e) {
    // Journaliser et renvoyer l'erreur
    error_log("Erreur lors de la configuration: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors de la configuration',
        'error' => $e->getMessage()
    ]);
}
?>
