
<?php
// Script d'initialisation de la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

error_log("=== DÉBUT DE L'EXÉCUTION DE bootstrap.php ===");

try {
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    echo "Connexion à la base de données réussie.<br>";
    
    // Initialisation de la table utilisateurs
    $tableUtilisateurs = "CREATE TABLE IF NOT EXISTS `utilisateurs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `nom` VARCHAR(100) NOT NULL,
        `prenom` VARCHAR(100) NOT NULL,
        `email` VARCHAR(255) NOT NULL UNIQUE,
        `mot_de_passe` VARCHAR(255) NOT NULL,
        `identifiant_technique` VARCHAR(100) NOT NULL UNIQUE,
        `role` VARCHAR(50) NOT NULL DEFAULT 'utilisateur',
        `date_creation` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $pdo->exec($tableUtilisateurs);
    echo "Table utilisateurs créée ou existante.<br>";
    
    // Vérifier les utilisateurs existants
    $stmt = $pdo->query("SELECT * FROM utilisateurs");
    $existingUsers = $stmt->fetchAll();
    
    $userIds = [];
    foreach ($existingUsers as $user) {
        $userIds[] = $user['identifiant_technique'];
    }
    
    echo "Utilisateurs existants: " . implode(', ', $userIds) . "<br>";
    
    // Si aucun utilisateur n'existe, créer l'utilisateur système
    if (empty($existingUsers)) {
        // Créer l'utilisateur système
        $insertSystem = $pdo->prepare("INSERT INTO utilisateurs 
            (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
            VALUES (?, ?, ?, ?, ?, ?)");
        $insertSystem->execute([
            'System', 
            'Admin', 
            'admin@example.com', 
            password_hash('Trottinette43!', PASSWORD_DEFAULT),
            'p71x6d_system',
            'admin'
        ]);
        echo "Utilisateur système créé.<br>";
        
        $userIds[] = 'p71x6d_system';
    }
    
    // Initialiser les tables pour chaque utilisateur existant
    foreach ($userIds as $userId) {
        echo "Initialisation des tables pour l'utilisateur: {$userId}<br>";
        
        // Table membres - Définition complète avec toutes les colonnes nécessaires
        $tableMembres = "CREATE TABLE IF NOT EXISTS `membres_{$userId}` (
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
        
        $pdo->exec($tableMembres);
        echo "Table membres_{$userId} créée ou existante.<br>";
        
        // Table exigences - Mise à jour de la structure pour correspondre aux fichiers de synchronisation
        $tableExigences = "CREATE TABLE IF NOT EXISTS `exigences_{$userId}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `nom` VARCHAR(255) NOT NULL,
            `responsabilites` TEXT,
            `exclusion` TINYINT(1) DEFAULT 0,
            `atteinte` ENUM('NC', 'PC', 'C') NULL,
            `groupId` VARCHAR(36) NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $pdo->exec($tableExigences);
        echo "Table exigences_{$userId} créée ou existante.<br>";
        
        // Table documents
        $tableDocuments = "CREATE TABLE IF NOT EXISTS `documents_{$userId}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `nom` VARCHAR(255) NOT NULL,
            `fichier_path` VARCHAR(255) NULL,
            `responsabilites` TEXT NULL,
            `etat` VARCHAR(50) NULL,
            `groupId` VARCHAR(36) NULL,
            `userId` VARCHAR(50) NOT NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $pdo->exec($tableDocuments);
        echo "Table documents_{$userId} créée ou existante.<br>";
        
        // Table collaboration (remplace bibliotheque)
        $tableCollaboration = "CREATE TABLE IF NOT EXISTS `collaboration_{$userId}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `nom` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `link` VARCHAR(255) NULL,
            `groupId` VARCHAR(36) NULL,
            `userId` VARCHAR(50) NOT NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $pdo->exec($tableCollaboration);
        echo "Table collaboration_{$userId} créée ou existante.<br>";
        
        // Table pilotage
        $tablePilotage = "CREATE TABLE IF NOT EXISTS `pilotage_{$userId}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `titre` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `statut` VARCHAR(50) NULL,
            `priorite` VARCHAR(50) NULL,
            `date_debut` DATE NULL,
            `date_fin` DATE NULL,
            `responsabilites` TEXT NULL,
            `userId` VARCHAR(50) NOT NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
        
        $pdo->exec($tablePilotage);
        echo "Table pilotage_{$userId} créée ou existante.<br>";
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Base de données initialisée avec succès',
        'users' => $userIds,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans bootstrap.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans bootstrap.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE bootstrap.php ===");
}
?>
