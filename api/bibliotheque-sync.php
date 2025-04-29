<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation
error_log("=== DEBUT DE L'EXÉCUTION DE bibliotheque-sync.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);

// Capturer les données brutes pour le débogage
$rawInput = file_get_contents("php://input");
error_log("Données brutes reçues: " . $rawInput);

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Récupérer les données POST JSON
    $data = json_decode($rawInput, true);
    
    if (!$rawInput || !$data) {
        throw new Exception("Aucune donnée reçue ou format JSON invalide");
    }
    
    error_log("Données décodées pour synchronisation de la bibliothèque/collaboration");
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId'])) {
        throw new Exception("Données incomplètes. 'userId' est requis");
    }
    
    $userId = $data['userId'];
    error_log("Synchronisation pour l'utilisateur: {$userId}");
    
    // Récupérer les données à synchroniser
    // Pour plus de flexibilité, vérifier plusieurs noms possibles
    $ressources = null;
    if (isset($data['collaboration']) && is_array($data['collaboration'])) {
        $ressources = $data['collaboration'];
        error_log("Données trouvées sous 'collaboration'");
        $tablePrefix = "collaboration";
    } elseif (isset($data['bibliotheque']) && is_array($data['bibliotheque'])) {
        $ressources = $data['bibliotheque'];
        error_log("Données trouvées sous 'bibliotheque'");
        $tablePrefix = "bibliotheque";
    } elseif (isset($data['documents']) && is_array($data['documents'])) {
        $ressources = $data['documents'];
        error_log("Données trouvées sous 'documents'");
        $tablePrefix = "bibliotheque";
    } elseif (isset($data['ressources']) && is_array($data['ressources'])) {
        $ressources = $data['ressources'];
        error_log("Données trouvées sous 'ressources'");
        $tablePrefix = "bibliotheque";
    } else {
        // Parcourir toutes les clés pour trouver un tableau potentiel
        foreach ($data as $key => $value) {
            if (is_array($value) && $key !== 'userId' && $key !== 'groups') {
                $ressources = $value;
                error_log("Données trouvées sous '{$key}'");
                $tablePrefix = ($key === "collaboration") ? "collaboration" : "bibliotheque";
                break;
            }
        }
    }
    
    if (!$ressources) {
        throw new Exception("Aucune donnée de bibliothèque/collaboration trouvée dans la requête");
    }
    
    error_log("Nombre de ressources: " . count($ressources));
    
    // Récupérer également les groupes si présents
    $groups = isset($data['groups']) ? $data['groups'] : [];
    error_log("Nombre de groupes: " . count($groups));
    
    // Connexion à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    error_log("Connexion à la base de données réussie");
    
    // Nom de la table spécifique à l'utilisateur
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tableName = $tablePrefix . "_" . $safeUserId;
    $groupsTableName = $tablePrefix . "_groups_" . $safeUserId;
    error_log("Tables à utiliser: {$tableName}, {$groupsTableName}");
    
    // Créer la table des ressources si elle n'existe pas
    $createTableQuery = "CREATE TABLE IF NOT EXISTS `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `link` TEXT NULL,
        `groupId` VARCHAR(36) NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    error_log("Création de la table des ressources si nécessaire");
    $pdo->exec($createTableQuery);
    
    // Créer la table des groupes si elle n'existe pas
    $createGroupsTableQuery = "CREATE TABLE IF NOT EXISTS `{$groupsTableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `name` VARCHAR(255) NOT NULL,
        `expanded` TINYINT(1) DEFAULT 0,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    error_log("Création de la table des groupes si nécessaire");
    $pdo->exec($createGroupsTableQuery);
    
    // Démarrer une transaction
    error_log("Début de la transaction");
    $pdo->beginTransaction();
    $transaction_active = true;
    
    try {
        // Vider les tables avant d'insérer les nouvelles données
        $pdo->exec("TRUNCATE TABLE `{$tableName}`");
        $pdo->exec("TRUNCATE TABLE `{$groupsTableName}`");
        error_log("Tables vidées");
        
        // Insérer les groupes
        if (count($groups) > 0) {
            error_log("Insertion des groupes...");
            $insertQuery = "INSERT INTO `{$groupsTableName}` 
                (id, name, expanded) 
                VALUES (:id, :name, :expanded)";
            $stmt = $pdo->prepare($insertQuery);
            
            foreach ($groups as $index => $group) {
                error_log("Traitement du groupe " . ($index + 1) . "/" . count($groups) . " - ID: " . $group['id']);
                
                // Vérifier les champs requis
                if (!isset($group['id']) || !isset($group['name'])) {
                    error_log("AVERTISSEMENT: Groupe incomplet, ignoré");
                    continue;
                }
                
                $expanded = isset($group['expanded']) ? ($group['expanded'] ? 1 : 0) : 0;
                
                $stmt->execute([
                    'id' => $group['id'],
                    'name' => $group['name'],
                    'expanded' => $expanded
                ]);
            }
            error_log("Tous les groupes ont été insérés");
        }
        
        // Insérer les ressources
        if (count($ressources) > 0) {
            error_log("Insertion des ressources...");
            $insertQuery = "INSERT INTO `{$tableName}` 
                (id, name, link, groupId) 
                VALUES (:id, :name, :link, :groupId)";
            $stmt = $pdo->prepare($insertQuery);
            
            foreach ($ressources as $index => $ressource) {
                error_log("Traitement de la ressource " . ($index + 1) . "/" . count($ressources) . " - ID: " . $ressource['id']);
                
                // Vérifier les champs requis
                if (!isset($ressource['id']) || !isset($ressource['name'])) {
                    error_log("AVERTISSEMENT: Ressource incomplète, ignorée");
                    continue;
                }
                
                $stmt->execute([
                    'id' => $ressource['id'],
                    'name' => $ressource['name'],
                    'link' => isset($ressource['link']) ? $ressource['link'] : null,
                    'groupId' => isset($ressource['groupId']) ? $ressource['groupId'] : null
                ]);
            }
            error_log("Toutes les ressources ont été insérées");
        }
        
        // Valider la transaction
        if ($transaction_active && $pdo->inTransaction()) {
            $pdo->commit();
            $transaction_active = false;
            error_log("Transaction validée");
        }
        
        // Vérifier que les données ont bien été enregistrées
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `{$tableName}`");
        $resourceCount = $countStmt->fetchColumn();
        
        $countGroupsStmt = $pdo->query("SELECT COUNT(*) FROM `{$groupsTableName}`");
        $groupCount = $countGroupsStmt->fetchColumn();
        
        error_log("Nombre de ressources enregistrées: {$resourceCount}");
        error_log("Nombre de groupes enregistrés: {$groupCount}");
        
        // Réponse réussie
        $response = [
            'success' => true,
            'message' => 'Synchronisation réussie',
            'count' => $resourceCount,
            'groups_count' => $groupCount
        ];
        
        error_log("Réponse finale: " . json_encode($response));
        echo json_encode($response);
        
    } catch (Exception $e) {
        // Annuler la transaction en cas d'erreur
        if ($transaction_active && $pdo->inTransaction()) {
            $pdo->rollBack();
            $transaction_active = false;
            error_log("Transaction annulée suite à une erreur: " . $e->getMessage());
        }
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans bibliotheque-sync.php: " . $e->getMessage());
    http_response_code(500);
    $errorResponse = [
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur PDO: " . json_encode($errorResponse));
} catch (Exception $e) {
    error_log("Exception dans bibliotheque-sync.php: " . $e->getMessage());
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur générale: " . json_encode($errorResponse));
} finally {
    // S'assurer que la transaction est terminée si elle est encore active
    if (isset($pdo) && isset($transaction_active) && $transaction_active && $pdo->inTransaction()) {
        try {
            error_log("Annulation de la transaction qui était encore active dans le bloc finally");
            $pdo->rollBack();
        } catch (Exception $e) {
            error_log("Erreur lors du rollback final: " . $e->getMessage());
        }
    }
    
    error_log("=== FIN DE L'EXÉCUTION DE bibliotheque-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}
