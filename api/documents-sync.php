
<?php
// Force output buffering to prevent output before headers
ob_start();

// Headers pour CORS et Content-Type
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, User-Agent");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Journalisation détaillée
error_log("=== DEBUT DE L'EXÉCUTION DE documents-sync.php ===");
error_log("Méthode: " . $_SERVER['REQUEST_METHOD'] . " - URI: " . $_SERVER['REQUEST_URI']);
error_log("User-Agent: " . (isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'Non défini'));

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

try {
    // Nettoyer le buffer
    if (ob_get_level()) ob_clean();
    
    // Configuration de la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_richard";
    $password = "Trottinette43!";
    
    // Essayer de se connecter à la base de données
    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    error_log("Connexion à la base de données réussie");
    
    // Déterminer l'action en fonction de la méthode HTTP
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Récupération des documents
            handleGetRequest($pdo);
            break;
            
        case 'POST':
            // Synchronisation des documents
            handlePostRequest($pdo);
            break;
            
        default:
            throw new Exception("Méthode HTTP non supportée: " . $_SERVER['REQUEST_METHOD']);
    }
} catch (Exception $e) {
    error_log("Exception dans documents-sync.php: " . $e->getMessage());
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur: " . json_encode($errorResponse));
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE documents-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}

// Fonction pour gérer les requêtes GET
function handleGetRequest($pdo) {
    error_log("Traitement de la requête GET pour récupérer les documents");
    
    // Forcer l'utilisation de p71x6d_richard sans utiliser le paramètre userId
    $userId = "p71x6d_richard";
    error_log("Récupération des documents avec ID forcé: {$userId}");
    
    // Vérifier et créer la table avec la bonne structure si nécessaire
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tableName = "documents_{$safeUserId}";
    verifyAndCreateDocumentTable($pdo, $tableName);
    
    // Récupérer tous les documents de la table avec paramètres nommés
    $sql = "SELECT * FROM `{$tableName}`";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("Nombre de documents récupérés: " . count($documents));
    
    // Réponse JSON
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'documents' => $documents,
        'count' => count($documents),
        'timestamp' => date('c')
    ]);
}

// Fonction pour gérer les requêtes POST
function handlePostRequest($pdo) {
    error_log("Traitement de la requête POST pour synchroniser les documents");
    
    // Récupérer les données POST JSON
    $json = file_get_contents('php://input');
    error_log("Données reçues (brut): " . substr($json, 0, 100) . "...");
    
    $data = json_decode($json, true);
    
    if ($json === false || $json === "") {
        throw new Exception("Aucune donnée reçue. Input vide.");
    }
    
    if ($data === null) {
        error_log("Erreur JSON: " . json_last_error_msg() . " - JSON reçu: " . substr($json, 0, 100));
        throw new Exception("Format JSON invalide: " . json_last_error_msg());
    }
    
    // Forcer l'utilisation de p71x6d_richard comme base de données pour tous
    $userId = "p71x6d_richard";
    error_log("Synchronisation avec ID forcé: {$userId}");
    
    // Déterminer la clé dans laquelle se trouvent les documents
    $documents = [];
    if (isset($data['pilotage_documents'])) {
        $documents = $data['pilotage_documents'];
    } elseif (isset($data['documents'])) {
        $documents = $data['documents'];
    } else {
        // Parcourir toutes les clés pour trouver des données
        foreach ($data as $key => $value) {
            if (is_array($value) && count($value) > 0) {
                $documents = $value;
                error_log("Documents trouvés dans la clé: {$key}");
                break;
            }
        }
    }
    
    if (!is_array($documents)) {
        error_log("Format de documents invalide: " . gettype($documents) . " au lieu d'un tableau");
        error_log("Contenu des données: " . print_r($data, true));
        throw new Exception("Impossible de trouver les documents dans les données");
    }
    
    error_log("Nombre de documents à synchroniser: " . count($documents));
    
    // Vérifier et créer la table avec la bonne structure si nécessaire
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tableName = "documents_{$safeUserId}";
    verifyAndCreateDocumentTable($pdo, $tableName);
    
    // Vider la table pour une synchronisation complète - uniquement si des documents sont fournis
    if (!empty($documents)) {
        $pdo->exec("TRUNCATE TABLE `{$tableName}`");
        error_log("Table {$tableName} vidée pour resynchronisation complète");
        
        // Préparer l'insertion des documents avec paramètres nommés
        $stmt = $pdo->prepare("INSERT INTO `{$tableName}` 
            (id, nom, fichier_path, responsabilites, etat, groupId, excluded, ordre) 
            VALUES (:id, :nom, :fichier, :resp, :etat, :groupe, :exclu, :ordre)");
        
        foreach ($documents as $doc) {
            try {
                // Vérifier que l'ID existe, sinon en générer un
                $id = isset($doc['id']) ? $doc['id'] : uniqid('doc_');
                
                // Vérifier que le nom existe
                $nom = isset($doc['nom']) ? $doc['nom'] : 'Document sans nom';
                
                // Traiter les responsabilités (gérer les formats possibles)
                $responsabilites = null;
                if (isset($doc['responsabilites'])) {
                    $responsabilites = is_array($doc['responsabilites']) ? 
                        json_encode($doc['responsabilites']) : $doc['responsabilites'];
                }
                
                // Récupérer les autres champs avec valeurs par défaut
                $fichier_path = isset($doc['fichier_path']) ? $doc['fichier_path'] : null;
                $etat = isset($doc['etat']) ? $doc['etat'] : null;
                $groupId = isset($doc['groupId']) ? $doc['groupId'] : null;
                $excluded = isset($doc['excluded']) && $doc['excluded'] ? 1 : 0;
                $ordre = isset($doc['ordre']) ? intval($doc['ordre']) : 0;
                
                // Liaison des paramètres avec vérification des types
                $stmt->bindParam(':id', $id);
                $stmt->bindParam(':nom', $nom);
                $stmt->bindParam(':fichier', $fichier_path);
                $stmt->bindParam(':resp', $responsabilites);
                $stmt->bindParam(':etat', $etat);
                $stmt->bindParam(':groupe', $groupId);
                $stmt->bindParam(':exclu', $excluded, PDO::PARAM_INT);
                $stmt->bindParam(':ordre', $ordre, PDO::PARAM_INT);
                
                // Exécuter l'insertion avec gestion des erreurs
                if (!$stmt->execute()) {
                    throw new Exception("Erreur lors de l'insertion du document ID: $id");
                }
            } catch (Exception $insertError) {
                error_log("Erreur lors de l'insertion d'un document: " . $insertError->getMessage());
                // Continuer avec le document suivant sans interrompre la boucle
                continue;
            }
        }
    }
    
    // Réponse de succès
    $response = [
        'success' => true,
        'message' => 'Synchronisation réussie',
        'count' => count($documents),
        'timestamp' => date('c')
    ];
    
    http_response_code(200);
    echo json_encode($response);
    error_log("Réponse de documents-sync.php : " . json_encode($response));
}

// Fonction utilitaire pour vérifier et créer la table documents avec la bonne structure
function verifyAndCreateDocumentTable($pdo, $tableName) {
    // Vérifier si la table existe
    $stmt = $pdo->query("SHOW TABLES LIKE '{$tableName}'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        // Créer la table avec toutes les colonnes nécessaires
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$tableName}` (
            `id` VARCHAR(36) PRIMARY KEY,
            `nom` VARCHAR(255) NOT NULL,
            `fichier_path` VARCHAR(255) NULL,
            `responsabilites` TEXT NULL,
            `etat` VARCHAR(50) NULL,
            `groupId` VARCHAR(36) NULL,
            `excluded` BOOLEAN DEFAULT 0,
            `ordre` INT(11) NULL,
            `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
        error_log("Table {$tableName} créée");
    } else {
        // La table existe, vérifier et ajouter les colonnes manquantes
        // Vérifier la colonne 'nom'
        $stmt = $pdo->query("SHOW COLUMNS FROM `{$tableName}` LIKE 'nom'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE `{$tableName}` ADD COLUMN `nom` VARCHAR(255) NOT NULL AFTER `id`");
            error_log("Colonne 'nom' ajoutée à la table {$tableName}");
        }
        
        // Vérifier la colonne 'ordre'
        $stmt = $pdo->query("SHOW COLUMNS FROM `{$tableName}` LIKE 'ordre'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE `{$tableName}` ADD COLUMN `ordre` INT(11) NULL");
            error_log("Colonne 'ordre' ajoutée à la table {$tableName}");
        }
        
        // Vérifier la colonne 'excluded'
        $stmt = $pdo->query("SHOW COLUMNS FROM `{$tableName}` LIKE 'excluded'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE `{$tableName}` ADD COLUMN `excluded` BOOLEAN DEFAULT 0");
            error_log("Colonne 'excluded' ajoutée à la table {$tableName}");
        }
    }
}
?>
