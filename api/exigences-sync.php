
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
error_log("=== DEBUT DE L'EXÉCUTION DE exigences-sync.php ===");
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
            // Récupération des exigences
            handleGetRequest($pdo);
            break;
            
        case 'POST':
            // Synchronisation des exigences
            handlePostRequest($pdo);
            break;
            
        default:
            throw new Exception("Méthode HTTP non supportée: " . $_SERVER['REQUEST_METHOD']);
    }
} catch (Exception $e) {
    error_log("Exception dans exigences-sync.php: " . $e->getMessage());
    http_response_code(400);
    $errorResponse = [
        'success' => false,
        'message' => $e->getMessage()
    ];
    echo json_encode($errorResponse);
    error_log("Réponse d'erreur: " . json_encode($errorResponse));
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE exigences-sync.php ===");
    if (ob_get_level()) ob_end_flush();
}

// Fonction pour gérer les requêtes GET
function handleGetRequest($pdo) {
    error_log("Traitement de la requête GET pour récupérer les exigences");
    
    // Forcer l'utilisation de p71x6d_richard 
    $userId = "p71x6d_richard";
    error_log("Récupération des exigences avec ID forcé: {$userId}");
    
    // Vérifier si la table existe
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tableName = "exigences_{$safeUserId}";
    
    // Créer la table si elle n'existe pas
    $pdo->exec("CREATE TABLE IF NOT EXISTS `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(255) NOT NULL,
        `responsabilites` TEXT NULL,
        `exclusion` TINYINT(1) DEFAULT 0,
        `atteinte` ENUM('NC', 'PC', 'C') NULL,
        `groupId` VARCHAR(36) NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    // Récupérer toutes les exigences de la table avec paramètres nommés
    $stmt = $pdo->prepare("SELECT * FROM `{$tableName}`");
    $stmt->execute();
    $exigences = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("Nombre d'exigences récupérées: " . count($exigences));
    
    // Réponse JSON
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'exigences' => $exigences,
        'count' => count($exigences),
        'timestamp' => date('c')
    ]);
}

// Fonction pour gérer les requêtes POST
function handlePostRequest($pdo) {
    error_log("Traitement de la requête POST pour synchroniser les exigences");
    
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
    error_log("ID forcé à: {$userId} pour la base de données");
    
    // Déterminer la clé dans laquelle se trouvent les exigences
    $exigences = [];
    if (isset($data['exigences'])) {
        $exigences = $data['exigences'];
    } else {
        // Parcourir toutes les clés pour trouver des données
        foreach ($data as $key => $value) {
            if (is_array($value) && count($value) > 0) {
                $exigences = $value;
                error_log("Exigences trouvées dans la clé: {$key}");
                break;
            }
        }
    }
    
    if (!is_array($exigences)) {
        error_log("Format d'exigences invalide: " . gettype($exigences) . " au lieu d'un tableau");
        error_log("Contenu des données: " . print_r($data, true));
        throw new Exception("Impossible de trouver les exigences dans les données");
    }
    
    error_log("Nombre d'exigences à synchroniser: " . count($exigences));
    
    // Créer la table si elle n'existe pas
    $safeUserId = preg_replace('/[^a-zA-Z0-9_]/', '_', $userId);
    $tableName = "exigences_{$safeUserId}";
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS `{$tableName}` (
        `id` VARCHAR(36) PRIMARY KEY,
        `nom` VARCHAR(255) NOT NULL,
        `responsabilites` TEXT NULL,
        `exclusion` TINYINT(1) DEFAULT 0,
        `atteinte` ENUM('NC', 'PC', 'C') NULL,
        `groupId` VARCHAR(36) NULL,
        `date_creation` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `date_modification` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    // Vider la table pour une synchronisation complète - uniquement si des exigences sont fournies
    if (!empty($exigences)) {
        $pdo->exec("TRUNCATE TABLE `{$tableName}`");
        error_log("Table {$tableName} vidée pour resynchronisation complète");
        
        // Préparer l'insertion des exigences avec des paramètres nommés
        $stmt = $pdo->prepare("INSERT INTO `{$tableName}` 
                              (id, nom, responsabilites, exclusion, atteinte, groupId, date_creation) 
                              VALUES (:id, :nom, :resp, :excl, :att, :groupe, :date)");
        
        foreach ($exigences as $exigence) {
            try {
                // Vérifier que l'ID existe, sinon en générer un
                $id = isset($exigence['id']) ? $exigence['id'] : uniqid('exig_', true);
                
                // Vérifier que le nom existe
                $nom = isset($exigence['nom']) ? $exigence['nom'] : 'Exigence sans titre';
                
                // Traiter les responsabilités (gérer les formats possibles)
                $responsabilites = null;
                if (isset($exigence['responsabilites'])) {
                    $responsabilites = is_array($exigence['responsabilites']) ? 
                        json_encode($exigence['responsabilites']) : $exigence['responsabilites'];
                }
                
                // Préparer la date de création
                $dateCreation = isset($exigence['date_creation']) && !empty($exigence['date_creation']) 
                    ? date('Y-m-d H:i:s', strtotime($exigence['date_creation']))
                    : date('Y-m-d H:i:s');
                
                // Option d'exclusion et autres champs
                $exclusion = isset($exigence['exclusion']) ? (int)$exigence['exclusion'] : 0;
                $atteinte = isset($exigence['atteinte']) ? $exigence['atteinte'] : null;
                $groupId = isset($exigence['groupId']) ? $exigence['groupId'] : null;
                
                // Liaison des paramètres
                $stmt->bindParam(':id', $id);
                $stmt->bindParam(':nom', $nom);
                $stmt->bindParam(':resp', $responsabilites);
                $stmt->bindParam(':excl', $exclusion, PDO::PARAM_INT);
                $stmt->bindParam(':att', $atteinte);
                $stmt->bindParam(':groupe', $groupId);
                $stmt->bindParam(':date', $dateCreation);
                
                // Exécuter l'insertion avec gestion des erreurs
                if (!$stmt->execute()) {
                    throw new Exception("Erreur lors de l'insertion de l'exigence ID: $id");
                }
            } catch (Exception $insertError) {
                error_log("Erreur lors de l'insertion d'une exigence: " . $insertError->getMessage());
                // Continuer avec l'exigence suivante sans interrompre la boucle
                continue;
            }
        }
    }
    
    // Réponse de succès
    $response = [
        'success' => true,
        'message' => 'Synchronisation réussie',
        'count' => count($exigences),
        'timestamp' => date('c')
    ];
    
    http_response_code(200);
    echo json_encode($response);
    error_log("Réponse de exigences-sync.php : " . json_encode($response));
}
?>
