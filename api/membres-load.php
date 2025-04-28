
<?php
require_once 'services/DataSyncService.php';

// Initialiser le service
$service = new DataSyncService('membres');
$service->setStandardHeaders();
$service->handleOptionsRequest();

try {
    // Vérifier si l'userId est présent
    if (!isset($_GET['userId'])) {
        throw new Exception("Paramètre 'userId' manquant");
    }
    
    $userId = $service->sanitizeUserId($_GET['userId']);
    
    // Connecter à la base de données
    if (!$service->connectToDatabase()) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    // Schéma de la table membres
    $schema = "CREATE TABLE IF NOT EXISTS `membres_{$userId}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(100) NOT NULL,
        `prenom` VARCHAR(100) NOT NULL,
        `email` VARCHAR(255) NULL,
        `telephone` VARCHAR(20) NULL,
        `fonction` VARCHAR(100) NULL,
        `organisation` VARCHAR(255) NULL,
        `notes` TEXT NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    // Créer la table si nécessaire
    if (!$service->ensureTableExists($schema)) {
        throw new Exception("Impossible de créer ou vérifier la table");
    }
    
    // Données de test pour les nouveaux utilisateurs
    $testMembers = [
        [
            'id' => '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'email' => 'jean.dupont@example.com',
            'telephone' => '0601020304',
            'fonction' => 'Directeur',
            'organisation' => 'Entreprise A',
            'notes' => 'Contact principal'
        ],
        [
            'id' => '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
            'nom' => 'Martin',
            'prenom' => 'Sophie',
            'email' => 'sophie.martin@example.com',
            'telephone' => '0607080910',
            'fonction' => 'Responsable RH',
            'organisation' => 'Entreprise B',
            'notes' => 'Partenaire stratégique'
        ]
    ];
    
    // Insérer des données de test si nécessaire
    $service->insertTestData($testMembers);
    
    // Charger les données
    $membres = $service->loadData();
    
    // Réponse réussie
    echo json_encode([
        'success' => true,
        'membres' => $membres,
        'count' => count($membres)
    ]);
    
} catch (Exception $e) {
    error_log("Erreur dans membres-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
} finally {
    $service->finalize();
}
?>
