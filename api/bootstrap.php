
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
    
    // Vérifier si l'utilisateur système existe déjà
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE identifiant_technique = ?");
    $stmt->execute(['p71x6d_system']);
    $userExists = (int)$stmt->fetchColumn() > 0;
    
    if (!$userExists) {
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
    }
    
    // Vérifier si l'utilisateur Antoine Cirier existe déjà
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE email = ?");
    $stmt->execute(['antcirier@gmail.com']);
    $antExists = (int)$stmt->fetchColumn() > 0;
    
    if (!$antExists) {
        // Créer l'utilisateur Antoine Cirier
        $insertAnt = $pdo->prepare("INSERT INTO utilisateurs 
            (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
            VALUES (?, ?, ?, ?, ?, ?)");
        $insertAnt->execute([
            'Cirier', 
            'Antoine', 
            'antcirier@gmail.com', 
            password_hash('Trottinette43!', PASSWORD_DEFAULT),
            'p71x6d_cirier',
            'admin'
        ]);
        echo "Utilisateur Antoine Cirier créé.<br>";
    }
    
    // Initialiser les tables pour les utilisateurs
    $userId = 'p71x6d_system';
    
    // Table membres
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
    
    // Table exigences
    $tableExigences = "CREATE TABLE IF NOT EXISTS `exigences_{$userId}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `code` VARCHAR(50) NOT NULL,
        `description` TEXT NOT NULL,
        `niveau` VARCHAR(20) NULL,
        `categorie` VARCHAR(100) NULL,
        `etat` VARCHAR(50) NULL DEFAULT 'à traiter',
        `notes` TEXT NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $pdo->exec($tableExigences);
    echo "Table exigences_{$userId} créée ou existante.<br>";
    
    // Vérifier si des membres existent déjà
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `membres_{$userId}`");
    $stmt->execute();
    $membresExistent = (int)$stmt->fetchColumn() > 0;
    
    if (!$membresExistent) {
        // Insérer des membres de test
        $insertMembre = $pdo->prepare("INSERT INTO `membres_{$userId}` 
            (id, nom, prenom, email, telephone, fonction, organisation, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        $insertMembre->execute([
            'mem-'.bin2hex(random_bytes(8)),
            'Dupont',
            'Jean',
            'jean.dupont@example.com',
            '0601020304',
            'Directeur',
            'Entreprise A',
            'Contact principal'
        ]);
        
        $insertMembre->execute([
            'mem-'.bin2hex(random_bytes(8)),
            'Martin',
            'Sophie',
            'sophie.martin@example.com',
            '0607080910',
            'Responsable RH',
            'Entreprise B',
            'Partenaire stratégique'
        ]);
        
        echo "Membres de test ajoutés.<br>";
    }
    
    // Vérifier si des exigences existent déjà
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `exigences_{$userId}`");
    $stmt->execute();
    $exigencesExistent = (int)$stmt->fetchColumn() > 0;
    
    if (!$exigencesExistent) {
        // Insérer des exigences de test
        $insertExigence = $pdo->prepare("INSERT INTO `exigences_{$userId}` 
            (id, code, description, niveau, categorie, etat, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        $insertExigence->execute([
            'exig-'.bin2hex(random_bytes(8)),
            'EX-001',
            'Mettre en place un système de gestion documentaire',
            'Critique',
            'Documentation',
            'En cours',
            'Priorité haute pour l\'audit'
        ]);
        
        $insertExigence->execute([
            'exig-'.bin2hex(random_bytes(8)),
            'EX-002',
            'Former le personnel aux procédures qualité',
            'Important',
            'Formation',
            'À traiter',
            'Planifier avant fin du mois'
        ]);
        
        echo "Exigences de test ajoutées.<br>";
    }
    
    // Même chose pour les tables de l'utilisateur Antoine Cirier
    $userId = 'p71x6d_cirier';
    
    // Table membres
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
    
    // Table exigences
    $tableExigences = "CREATE TABLE IF NOT EXISTS `exigences_{$userId}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `code` VARCHAR(50) NOT NULL,
        `description` TEXT NOT NULL,
        `niveau` VARCHAR(20) NULL,
        `categorie` VARCHAR(100) NULL,
        `etat` VARCHAR(50) NULL DEFAULT 'à traiter',
        `notes` TEXT NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $pdo->exec($tableExigences);
    echo "Table exigences_{$userId} créée ou existante.<br>";
    
    // Vérifier si des membres existent déjà
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `membres_{$userId}`");
    $stmt->execute();
    $membresExistent = (int)$stmt->fetchColumn() > 0;
    
    if (!$membresExistent) {
        // Insérer des membres de test
        $insertMembre = $pdo->prepare("INSERT INTO `membres_{$userId}` 
            (id, nom, prenom, email, telephone, fonction, organisation, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        $insertMembre->execute([
            'mem-'.bin2hex(random_bytes(8)),
            'Dubois',
            'Philippe',
            'philippe.dubois@example.com',
            '0612345678',
            'Directeur Qualité',
            'Entreprise C',
            'Expert Qualiopi'
        ]);
        
        $insertMembre->execute([
            'mem-'.bin2hex(random_bytes(8)),
            'Garcia',
            'Maria',
            'maria.garcia@example.com',
            '0698765432',
            'Consultante',
            'Entreprise D',
            'Spécialiste certification'
        ]);
        
        echo "Membres de test ajoutés pour {$userId}.<br>";
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Base de données initialisée avec succès',
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
