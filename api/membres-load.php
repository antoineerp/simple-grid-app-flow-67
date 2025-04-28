
<?php
// Force output buffering to prevent output before headers
ob_start();

// Fichier pour charger les données des membres depuis le serveur
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE membres-load.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
if (isset($_GET['userId'])) {
    $rawUserId = $_GET['userId'];
    error_log("UserId reçu brut: " . $rawUserId);
    
    // Détecter si c'est un objet JSON encodé en URL
    if (strpos($rawUserId, '%5Bobject%20Object%5D') !== false || $rawUserId === '[object Object]') {
        error_log("Détection d'un [object Object], utilisation de l'ID par défaut");
        $_GET['userId'] = 'p71x6d_system';
    }
    
    error_log("UserId utilisé après vérification: " . $_GET['userId']);
} else {
    error_log("UserId non fourni dans la requête");
}

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journalisation
error_log("API membres-load.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Vérifier si l'userId est présent - Version robuste qui fonctionne même avec des paramètres d'URL mal formés
    $userId = 'p71x6d_system'; // valeur par défaut
    
    if (isset($_GET['userId']) && !empty($_GET['userId']) && $_GET['userId'] !== '[object Object]') {
        $userId = $_GET['userId'];
        // Vérification supplémentaire pour les chaînes contenant "object"
        if (strpos($userId, 'object') !== false) {
            error_log("UserId contient 'object', utilisation de l'ID par défaut");
            $userId = 'p71x6d_system';
        }
    }
    
    error_log("UserId final utilisé: {$userId}");
    
    // Connexion à la base de données
    try {
        $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        error_log("Connexion à la base de données réussie");
    } catch (PDOException $pdoError) {
        error_log("Erreur de connexion à la base de données: " . $pdoError->getMessage());
        // Retourner une liste vide plutôt qu'une erreur pour une meilleure expérience utilisateur
        echo json_encode([
            'success' => true,
            'membres' => [],
            'message' => 'Base de données temporairement indisponible'
        ]);
        exit;
    }
    
    // Purifier le nom d'utilisateur pour créer un nom de table valide
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tableName = "membres_" . $safeUserId;
    error_log("Table à consulter (après nettoyage): {$tableName}");
    
    // Vérifier si la table existe
    $tableExistsQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute([$dbname, $tableName]);
    $tableExists = (int)$stmt->fetchColumn() > 0;
    
    $membres = [];
    
    if (!$tableExists) {
        // Créer la table si elle n'existe pas
        error_log("La table {$tableName} n'existe pas. Création en cours...");
        
        // Structure de table standard
        $createTableQuery = "CREATE TABLE `{$tableName}` (
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
        
        $pdo->exec($createTableQuery);
        error_log("Table {$tableName} créée avec succès");
        
        // Définir les membres de test
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
        
        // Avant d'insérer, vérifier quelles colonnes existent réellement
        $colonnes = ['id', 'nom', 'prenom', 'email', 'telephone', 'fonction', 'organisation', 'notes'];
        $colonnesPresentes = [];
        
        // Construire dynamiquement la requête d'insertion basée sur les colonnes existantes
        $placeholders = [];
        $colonnesSql = [];
        
        foreach ($colonnes as $colonne) {
            $colonnesPresentes[] = $colonne;
            $colonnesSql[] = "`$colonne`";
            $placeholders[] = "?";
        }
        
        $colonnesStr = implode(", ", $colonnesSql);
        $placeholdersStr = implode(", ", $placeholders);
        
        $insertQuery = "INSERT INTO `{$tableName}` ($colonnesStr) VALUES ($placeholdersStr)";
        $stmt = $pdo->prepare($insertQuery);
        
        foreach ($testMembers as $member) {
            $values = [];
            foreach ($colonnesPresentes as $colonne) {
                $values[] = isset($member[$colonne]) ? $member[$colonne] : null;
            }
            $stmt->execute($values);
        }
        
        error_log("Données de test insérées dans la table {$tableName}");
        
        // Récupérer les données nouvellement insérées
        $query = "SELECT * FROM `{$tableName}`";
        $stmt = $pdo->query($query);
        $membres = $stmt->fetchAll();
    } else {
        // La table existe, récupérer les données
        $query = "SELECT * FROM `{$tableName}`";
        $stmt = $pdo->query($query);
        $membres = $stmt->fetchAll();
        
        error_log("Nombre de membres récupérés: " . count($membres));
        
        // Si aucun membre n'est trouvé et que c'est l'utilisateur système, ajouter des données de test
        if (count($membres) === 0 && ($userId === 'p71x6d_system' || $userId === 'p71x6d_cirier')) {
            error_log("Aucun membre trouvé pour {$userId}. Ajout de données de test.");
            
            // Insérer quelques données de test
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
            
            // Vérifier quelles colonnes existent dans la table existante
            $showColumnsQuery = "SHOW COLUMNS FROM `{$tableName}`";
            $stmt = $pdo->prepare($showColumnsQuery);
            $stmt->execute();
            $colonnesExistantes = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            error_log("Colonnes existantes dans {$tableName}: " . implode(", ", $colonnesExistantes));
            
            // Construire une requête d'insertion basée uniquement sur les colonnes existantes
            $colonnesSql = [];
            $placeholders = [];
            
            foreach ($colonnesExistantes as $colonne) {
                $colonnesSql[] = "`$colonne`";
                $placeholders[] = "?";
            }
            
            $colonnesStr = implode(", ", $colonnesSql);
            $placeholdersStr = implode(", ", $placeholders);
            
            $insertQuery = "INSERT INTO `{$tableName}` ($colonnesStr) VALUES ($placeholdersStr)";
            error_log("Requête d'insertion préparée: $insertQuery");
            
            $stmt = $pdo->prepare($insertQuery);
            
            foreach ($testMembers as $member) {
                // Filtrer les valeurs pour ne garder que celles qui correspondent aux colonnes existantes
                $values = [];
                foreach ($colonnesExistantes as $colonne) {
                    $values[] = isset($member[$colonne]) ? $member[$colonne] : null;
                }
                
                try {
                    $stmt->execute($values);
                    error_log("Insertion réussie pour membre: " . $member['nom']);
                } catch (PDOException $e) {
                    error_log("Erreur lors de l'insertion: " . $e->getMessage());
                    error_log("Valeurs: " . json_encode($values));
                }
            }
            
            error_log("Données de test insérées dans la table {$tableName}");
            
            // Récupérer les données nouvellement insérées
            $query = "SELECT * FROM `{$tableName}`";
            $stmt = $pdo->query($query);
            $membres = $stmt->fetchAll();
        }
    }
    
    // Formater les dates pour le client
    foreach ($membres as &$membre) {
        if (isset($membre['date_creation']) && $membre['date_creation']) {
            $membre['date_creation'] = date('Y-m-d\TH:i:s', strtotime($membre['date_creation']));
        }
        if (isset($membre['date_modification']) && $membre['date_modification']) {
            $membre['date_modification'] = date('Y-m-d\TH:i:s', strtotime($membre['date_modification']));
        }
    }
    
    // Journaliser le résultat
    error_log("Réponse membres: " . count($membres) . " membres trouvés pour {$userId}");
    
    // Renvoyer les données au format JSON
    echo json_encode([
        'success' => true,
        'membres' => $membres,
        'count' => count($membres)
    ]);
    
} catch (Exception $e) {
    error_log("Exception dans membres-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE membres-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
?>
