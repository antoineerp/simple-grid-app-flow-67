
<?php
// Script pour corriger la structure de la table utilisateurs et la compatibilité des rôles
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Fonction pour journaliser et retourner des messages d'erreur/succès
function log_and_return($status, $message, $data = null) {
    error_log($message);
    $response = ['status' => $status, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

try {
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Connexion à la base de données...");
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Étape 1 : Vérifier si la table utilisateurs existe
    $tableExistsQuery = "SHOW TABLES LIKE 'utilisateurs'";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute();
    
    $results = ['actions' => []];
    
    if ($stmt->rowCount() == 0) {
        // La table n'existe pas, la créer avec la structure correcte
        error_log("La table 'utilisateurs' n'existe pas, création...");
        $createTableQuery = "CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            mot_de_passe VARCHAR(255) NOT NULL,
            identifiant_technique VARCHAR(100) NOT NULL UNIQUE,
            role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL,
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $pdo->exec($createTableQuery);
        $results['actions'][] = "Table 'utilisateurs' créée avec succès";
        
        // Créer un utilisateur admin par défaut
        $defaultAdminQuery = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, identifiant_technique, role) 
        VALUES ('Admin', 'System', 'admin@system.local', :password, 'p71x6d_system_admin', 'admin')";
        
        $stmt = $pdo->prepare($defaultAdminQuery);
        $hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
        
        $results['actions'][] = "Utilisateur admin par défaut créé";
    } else {
        error_log("La table 'utilisateurs' existe déjà");
        $results['actions'][] = "Table 'utilisateurs' existante";
        
        // Étape 2 : Vérifier la structure de la colonne 'role'
        $roleColumnQuery = "SHOW COLUMNS FROM utilisateurs LIKE 'role'";
        $stmt = $pdo->prepare($roleColumnQuery);
        $stmt->execute();
        $roleColumn = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($roleColumn) {
            $results['existing_role_structure'] = $roleColumn['Type'];
            error_log("Structure actuelle de la colonne 'role': " . $roleColumn['Type']);
            
            // Vérifier si la colonne est de type ENUM et si elle inclut tous les types nécessaires
            if (strpos($roleColumn['Type'], 'enum') === 0) {
                preg_match('/enum\((.*)\)/', $roleColumn['Type'], $matches);
                
                if (isset($matches[1])) {
                    $enumStr = $matches[1];
                    $enumValues = array_map(function($val) {
                        return trim($val, "'\"");
                    }, explode(',', $enumStr));
                    
                    $results['current_roles'] = $enumValues;
                    
                    // Vérifier si tous les rôles nécessaires sont présents
                    $requiredRoles = ['admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire'];
                    $missingRoles = array_diff($requiredRoles, $enumValues);
                    
                    if (!empty($missingRoles)) {
                        // Des rôles sont manquants, modifier la colonne
                        error_log("Rôles manquants: " . implode(', ', $missingRoles));
                        $results['missing_roles'] = $missingRoles;
                        
                        try {
                            $alterQuery = "ALTER TABLE utilisateurs MODIFY COLUMN role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL";
                            $pdo->exec($alterQuery);
                            $results['actions'][] = "Colonne 'role' modifiée pour inclure tous les rôles nécessaires";
                            error_log("Colonne 'role' modifiée avec succès");
                        } catch (PDOException $e) {
                            $results['errors'][] = "Erreur lors de la modification de la colonne 'role': " . $e->getMessage();
                            error_log("Erreur lors de la modification: " . $e->getMessage());
                        }
                    } else {
                        $results['actions'][] = "Tous les rôles nécessaires sont déjà présents";
                        error_log("Tous les rôles nécessaires sont déjà présents");
                    }
                }
            } else {
                // La colonne n'est pas de type ENUM, tenter de la convertir
                try {
                    $alterQuery = "ALTER TABLE utilisateurs MODIFY COLUMN role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL";
                    $pdo->exec($alterQuery);
                    $results['actions'][] = "Colonne 'role' convertie en ENUM avec tous les rôles nécessaires";
                    error_log("Colonne 'role' convertie en ENUM");
                } catch (PDOException $e) {
                    $results['errors'][] = "Erreur lors de la conversion de la colonne 'role': " . $e->getMessage();
                    error_log("Erreur lors de la conversion: " . $e->getMessage());
                }
            }
        } else {
            // La colonne n'existe pas, tenter de l'ajouter
            try {
                $alterQuery = "ALTER TABLE utilisateurs ADD COLUMN role ENUM('admin', 'user', 'administrateur', 'utilisateur', 'gestionnaire') NOT NULL DEFAULT 'user'";
                $pdo->exec($alterQuery);
                $results['actions'][] = "Colonne 'role' ajoutée à la table 'utilisateurs'";
                error_log("Colonne 'role' ajoutée");
            } catch (PDOException $e) {
                $results['errors'][] = "Erreur lors de l'ajout de la colonne 'role': " . $e->getMessage();
                error_log("Erreur lors de l'ajout: " . $e->getMessage());
            }
        }
    }
    
    // Étape 3 : Vérifier la structure finale de la table
    $structureQuery = "DESCRIBE utilisateurs";
    $stmt = $pdo->prepare($structureQuery);
    $stmt->execute();
    $tableStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $results['table_structure'] = $tableStructure;
    
    // Renvoyer une réponse de succès avec les informations
    log_and_return('success', 'Structure de la table utilisateurs vérifiée et mise à jour', $results);
    
} catch (PDOException $e) {
    log_and_return('error', 'Erreur de base de données: ' . $e->getMessage());
} catch (Exception $e) {
    log_and_return('error', 'Erreur générale: ' . $e->getMessage());
}
?>
