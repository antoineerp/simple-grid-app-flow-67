
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

// Fichier pour vérifier l'état des utilisateurs dans la base de données
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS, POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'exécution
error_log("=== EXÉCUTION DE check-users.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("Paramètres GET: " . print_r($_GET, true));

// Récupérer l'utilisateur source, si spécifié
$source = isset($_GET['source']) ? $_GET['source'] : 'default';
error_log("Source de connexion: " . $source);

// Capturer toute sortie pour éviter la contamination du JSON
if (ob_get_level()) ob_clean();

try {
    // Tester la connexion PDO directement sans passer par notre classe Database
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_richard";
    
    // Utiliser l'identifiant technique spécifié s'il est fourni et valide
    if (!empty($source) && $source !== 'default' && strpos($source, 'p71x6d_') === 0) {
        $username = $source;
        $password = "Trottinette43!";
        error_log("Utilisation de l'identifiant technique fourni: " . $username);
    } else {
        $username = "p71x6d_richard";
        $password = "Trottinette43!";
        error_log("Utilisation de l'identifiant par défaut: p71x6d_richard");
    }
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion PDO directe à la base de données avec utilisateur: " . $username);
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion PDO réussie");
    
    // Vérifier si la table existe
    $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        // La table n'existe pas, la créer
        error_log("La table 'utilisateurs' n'existe pas, création en cours");
        $createTableQuery = "CREATE TABLE IF NOT EXISTS utilisateurs (
            id VARCHAR(36) PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            mot_de_passe VARCHAR(255) NOT NULL,
            identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
            role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL,
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createTableQuery);
        error_log("Table 'utilisateurs' créée avec succès");
        
        // Créer un utilisateur admin par défaut
        $defaultAdminQuery = "INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, identifiant_technique, role) 
        VALUES (:id, 'Admin', 'System', 'admin@system.local', :password, 'p71x6d_richard_admin', 'admin')";
        
        $stmt = $pdo->prepare($defaultAdminQuery);
        $hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
        $adminId = bin2hex(random_bytes(16));
        $stmt->bindParam(':id', $adminId);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
        
        error_log("Utilisateur admin par défaut créé");
    } else {
        error_log("La table 'utilisateurs' existe déjà");
        
        // Vérifier la structure de la colonne 'role'
        $roleColumnQuery = "SHOW COLUMNS FROM utilisateurs LIKE 'role'";
        $stmt = $pdo->prepare($roleColumnQuery);
        $stmt->execute();
        $roleColumn = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($roleColumn) {
            error_log("Structure actuelle de la colonne 'role': " . $roleColumn['Type']);
            
            // Vérifier si la colonne 'role' inclut tous les types nécessaires
            if (strpos($roleColumn['Type'], 'enum') === 0 && 
                (!strpos($roleColumn['Type'], 'gestionnaire') || 
                 !strpos($roleColumn['Type'], 'utilisateur') || 
                 !strpos($roleColumn['Type'], 'administrateur'))) {
                
                error_log("Tentative de modification de la colonne 'role' pour inclure tous les types nécessaires");
                try {
                    $alterQuery = "ALTER TABLE utilisateurs MODIFY COLUMN role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL";
                    $pdo->exec($alterQuery);
                    error_log("Colonne 'role' modifiée avec succès");
                } catch (PDOException $e) {
                    error_log("Erreur lors de la modification de la colonne 'role': " . $e->getMessage());
                }
            }
        } else {
            error_log("Colonne 'role' introuvable dans la table 'utilisateurs'");
        }
        
        // Vérifier si la colonne 'id' est de type VARCHAR(36)
        $idColumnQuery = "SHOW COLUMNS FROM utilisateurs LIKE 'id'";
        $stmt = $pdo->prepare($idColumnQuery);
        $stmt->execute();
        $idColumn = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($idColumn && $idColumn['Type'] === 'int(11)') {
            // Tenter de convertir la colonne id en VARCHAR(36)
            error_log("Tentative de modification de la colonne 'id' de INT à VARCHAR(36)");
            try {
                // Créer une table temporaire
                $pdo->exec("CREATE TABLE utilisateurs_temp LIKE utilisateurs");
                $pdo->exec("ALTER TABLE utilisateurs_temp MODIFY COLUMN id VARCHAR(36) NOT NULL");
                
                // Copier les données avec conversion d'ID
                $selectQuery = "SELECT * FROM utilisateurs";
                $stmt = $pdo->prepare($selectQuery);
                $stmt->execute();
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Vider la table temporaire
                $pdo->exec("TRUNCATE TABLE utilisateurs_temp");
                
                // Insérer les données dans la table temporaire avec UUID
                foreach ($users as $user) {
                    $uuid = bin2hex(random_bytes(16));
                    $uuid = substr($uuid, 0, 8) . '-' . substr($uuid, 8, 4) . '-' . substr($uuid, 12, 4) . '-' . 
                           substr($uuid, 16, 4) . '-' . substr($uuid, 20);
                    
                    $insertQuery = "INSERT INTO utilisateurs_temp 
                                   (id, nom, prenom, email, mot_de_passe, identifiant_technique, role) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?)";
                    $insertStmt = $pdo->prepare($insertQuery);
                    $insertStmt->execute([
                        $uuid, 
                        $user['nom'], 
                        $user['prenom'], 
                        $user['email'], 
                        $user['mot_de_passe'], 
                        $user['identifiant_technique'], 
                        $user['role']
                    ]);
                }
                
                // Renommer les tables
                $pdo->exec("RENAME TABLE utilisateurs TO utilisateurs_old, utilisateurs_temp TO utilisateurs");
                $pdo->exec("DROP TABLE utilisateurs_old");
                
                error_log("Colonne 'id' convertie de INT à VARCHAR(36) avec succès");
            } catch (PDOException $e) {
                error_log("Erreur lors de la conversion de la colonne 'id': " . $e->getMessage());
            }
        }
    }
    
    // Récupérer tous les utilisateurs
    $query = "SELECT id, nom, prenom, email, role, identifiant_technique, date_creation FROM utilisateurs";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $count = count($users);
    
    error_log("Nombre d'utilisateurs récupérés: " . $count);
    
    // Vérifier et corriger les identifiants techniques incorrects
    $updatedUsers = [];
    foreach ($users as $user) {
        $needsUpdate = false;
        
        // Vérifier si l'identifiant technique est au bon format
        if (empty($user['identifiant_technique']) || strpos($user['identifiant_technique'], 'p71x6d_') !== 0) {
            $identifiant_technique = 'p71x6d_' . preg_replace('/[^a-z0-9]/', '', strtolower($user['nom']));
            
            // Vérifier si cet identifiant existe déjà
            $checkQuery = "SELECT COUNT(*) FROM utilisateurs WHERE identifiant_technique = ? AND id != ?";
            $checkStmt = $pdo->prepare($checkQuery);
            $checkStmt->execute([$identifiant_technique, $user['id']]);
            $exists = $checkStmt->fetchColumn() > 0;
            
            // Si l'identifiant existe déjà, ajouter un suffixe numérique
            if ($exists) {
                $counter = 1;
                $baseIdentifiant = $identifiant_technique;
                while ($exists) {
                    $identifiant_technique = $baseIdentifiant . $counter;
                    $checkStmt->execute([$identifiant_technique, $user['id']]);
                    $exists = $checkStmt->fetchColumn() > 0;
                    $counter++;
                }
            }
            
            // Mettre à jour l'utilisateur dans la base de données
            $updateQuery = "UPDATE utilisateurs SET identifiant_technique = ? WHERE id = ?";
            $updateStmt = $pdo->prepare($updateQuery);
            $updateStmt->execute([$identifiant_technique, $user['id']]);
            
            error_log("Identifiant technique mis à jour pour l'utilisateur {$user['id']} : {$identifiant_technique}");
            
            // Mettre à jour l'objet utilisateur pour la réponse
            $user['identifiant_technique'] = $identifiant_technique;
            $needsUpdate = true;
        }
        
        $updatedUsers[] = $user;
    }
    
    // Si des utilisateurs ont été mis à jour, récupérer la liste à nouveau
    if (!empty($updatedUsers)) {
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log("Utilisateurs récupérés après correction des identifiants: " . count($users));
    }
    
    // Vérifier la structure de la table pour le diagnostic
    $tableStructureQuery = "DESCRIBE utilisateurs";
    $stmt = $pdo->prepare($tableStructureQuery);
    $stmt->execute();
    $tableStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Nettoyer tout output accumulé
    if (ob_get_level()) ob_clean();
    
    // Préparer la réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion réussie à la base de données',
        'records' => $users,
        'count' => $count,
        'database_info' => [
            'host' => $host,
            'database' => $dbname,
            'user' => $username,
            'source' => $source
        ],
        'table_structure' => $tableStructure
    ]);
    exit;
} catch (PDOException $e) {
    error_log("Erreur de connexion PDO: " . $e->getMessage());
    
    // Nettoyer tout output accumulé
    if (ob_get_level()) ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage(),
        'source_attempted' => $source ?? 'default'
    ]);
    exit;
} catch (Exception $e) {
    error_log("Erreur générale: " . $e->getMessage());
    
    // Nettoyer tout output accumulé
    if (ob_get_level()) ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion',
        'error' => $e->getMessage(),
        'source_attempted' => $source ?? 'default'
    ]);
    exit;
} finally {
    // S'assurer que nous avons terminé proprement
    if (ob_get_level()) ob_end_clean();
}
?>
