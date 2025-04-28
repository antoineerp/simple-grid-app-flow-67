
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
        // Vérifier structure de la table membres
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `membres_{$userId}`");
        $stmt->execute();
        $colonnes = $stmt->fetchAll(PDO::FETCH_COLUMN, 0); // Récupère juste les noms de colonnes
        
        error_log("Colonnes trouvées dans membres_{$userId}: " . implode(", ", $colonnes));
        
        // Préparer la requête d'insertion avec les colonnes existantes
        $colonnesDispo = ['id', 'nom', 'prenom', 'email', 'telephone', 'fonction', 'organisation', 'notes'];
        $colonnesValides = array_intersect($colonnesDispo, $colonnes);
        
        if (count($colonnesValides) < 3) {
            // Si moins de 3 colonnes valides, il y a un problème avec la structure
            throw new Exception("Structure de table membres_{$userId} invalide. Colonnes disponibles: " . implode(", ", $colonnes));
        }
        
        // Construire la requête dynamiquement en fonction des colonnes disponibles
        $champs = implode(", ", $colonnesValides);
        $placeholders = implode(", ", array_fill(0, count($colonnesValides), "?"));
        
        $insertMembre = $pdo->prepare("INSERT INTO `membres_{$userId}` ({$champs}) VALUES ({$placeholders})");
        
        // Premier membre test
        $membre1 = [
            'id' => 'mem-' . bin2hex(random_bytes(8)),
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'email' => 'jean.dupont@example.com',
            'telephone' => '0601020304',
            'fonction' => 'Directeur',
            'organisation' => 'Entreprise A',
            'notes' => 'Contact principal'
        ];
        
        // Filtrer les valeurs en fonction des colonnes disponibles
        $valeurs1 = array_intersect_key($membre1, array_flip($colonnesValides));
        $insertMembre->execute(array_values($valeurs1));
        
        // Deuxième membre test
        $membre2 = [
            'id' => 'mem-' . bin2hex(random_bytes(8)),
            'nom' => 'Martin',
            'prenom' => 'Sophie',
            'email' => 'sophie.martin@example.com',
            'telephone' => '0607080910',
            'fonction' => 'Responsable RH',
            'organisation' => 'Entreprise B',
            'notes' => 'Partenaire stratégique'
        ];
        
        // Filtrer les valeurs en fonction des colonnes disponibles
        $valeurs2 = array_intersect_key($membre2, array_flip($colonnesValides));
        $insertMembre->execute(array_values($valeurs2));
        
        echo "Membres de test ajoutés.<br>";
    }
    
    // Vérifier si des exigences existent déjà
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `exigences_{$userId}`");
    $stmt->execute();
    $exigencesExistent = (int)$stmt->fetchColumn() > 0;
    
    if (!$exigencesExistent) {
        // Vérifier structure de la table exigences
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `exigences_{$userId}`");
        $stmt->execute();
        $colonnes = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        
        error_log("Colonnes trouvées dans exigences_{$userId}: " . implode(", ", $colonnes));
        
        // Préparer la requête d'insertion avec les colonnes existantes
        $colonnesDispo = ['id', 'code', 'description', 'niveau', 'categorie', 'etat', 'notes'];
        $colonnesValides = array_intersect($colonnesDispo, $colonnes);
        
        if (count($colonnesValides) < 3) {
            throw new Exception("Structure de table exigences_{$userId} invalide. Colonnes disponibles: " . implode(", ", $colonnes));
        }
        
        // Construire la requête dynamiquement
        $champs = implode(", ", $colonnesValides);
        $placeholders = implode(", ", array_fill(0, count($colonnesValides), "?"));
        
        $insertExigence = $pdo->prepare("INSERT INTO `exigences_{$userId}` ({$champs}) VALUES ({$placeholders})");
        
        // Première exigence test
        $exigence1 = [
            'id' => 'exig-' . bin2hex(random_bytes(8)),
            'code' => 'EX-001',
            'description' => 'Mettre en place un système de gestion documentaire',
            'niveau' => 'Critique',
            'categorie' => 'Documentation',
            'etat' => 'En cours',
            'notes' => 'Priorité haute pour l\'audit'
        ];
        
        // Filtrer les valeurs
        $valeurs1 = array_intersect_key($exigence1, array_flip($colonnesValides));
        $insertExigence->execute(array_values($valeurs1));
        
        // Deuxième exigence test
        $exigence2 = [
            'id' => 'exig-' . bin2hex(random_bytes(8)),
            'code' => 'EX-002',
            'description' => 'Former le personnel aux procédures qualité',
            'niveau' => 'Important',
            'categorie' => 'Formation',
            'etat' => 'À traiter',
            'notes' => 'Planifier avant fin du mois'
        ];
        
        // Filtrer les valeurs
        $valeurs2 = array_intersect_key($exigence2, array_flip($colonnesValides));
        $insertExigence->execute(array_values($valeurs2));
        
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
        // Vérifier structure de la table membres
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `membres_{$userId}`");
        $stmt->execute();
        $colonnes = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        
        error_log("Colonnes trouvées dans membres_{$userId}: " . implode(", ", $colonnes));
        
        // Préparer la requête d'insertion avec les colonnes existantes
        $colonnesDispo = ['id', 'nom', 'prenom', 'email', 'telephone', 'fonction', 'organisation', 'notes'];
        $colonnesValides = array_intersect($colonnesDispo, $colonnes);
        
        if (count($colonnesValides) < 3) {
            throw new Exception("Structure de table membres_{$userId} invalide. Colonnes disponibles: " . implode(", ", $colonnes));
        }
        
        // Construire la requête dynamiquement
        $champs = implode(", ", $colonnesValides);
        $placeholders = implode(", ", array_fill(0, count($colonnesValides), "?"));
        
        $insertMembre = $pdo->prepare("INSERT INTO `membres_{$userId}` ({$champs}) VALUES ({$placeholders})");
        
        // Premier membre test pour cet utilisateur
        $membre1 = [
            'id' => 'mem-' . bin2hex(random_bytes(8)),
            'nom' => 'Dubois',
            'prenom' => 'Philippe',
            'email' => 'philippe.dubois@example.com',
            'telephone' => '0612345678',
            'fonction' => 'Directeur Qualité',
            'organisation' => 'Entreprise C',
            'notes' => 'Expert Qualiopi'
        ];
        
        // Filtrer les valeurs
        $valeurs1 = array_intersect_key($membre1, array_flip($colonnesValides));
        $insertMembre->execute(array_values($valeurs1));
        
        // Deuxième membre test
        $membre2 = [
            'id' => 'mem-' . bin2hex(random_bytes(8)),
            'nom' => 'Garcia',
            'prenom' => 'Maria',
            'email' => 'maria.garcia@example.com',
            'telephone' => '0698765432',
            'fonction' => 'Consultante',
            'organisation' => 'Entreprise D',
            'notes' => 'Spécialiste certification'
        ];
        
        // Filtrer les valeurs
        $valeurs2 = array_intersect_key($membre2, array_flip($colonnesValides));
        $insertMembre->execute(array_values($valeurs2));
        
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
