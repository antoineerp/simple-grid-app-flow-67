
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
    
    if (!isset($_GET['userId'])) {
        throw new Exception("Le paramètre userId est requis");
    }
    
    $userId = $_GET['userId'];
    error_log("Récupération des exigences pour l'utilisateur: {$userId}");
    
    // Forcer l'utilisation de p71x6d_richard comme base de données pour tous
    $userId = "p71x6d_richard";
    error_log("ID forcé à: {$userId} pour la base de données");
    
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
    
    // Récupérer toutes les exigences de la table
    $stmt = $pdo->query("SELECT * FROM `{$tableName}`");
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
    error_log("Données reçues (brut): " . substr($json, 0, 500) . "...");
    
    $data = json_decode($json, true);
    
    if ($json === false || $json === "") {
        throw new Exception("Aucune donnée reçue. Input vide.");
    }
    
    if ($data === null) {
        error_log("Erreur JSON: " . json_last_error_msg() . " - JSON reçu: " . substr($json, 0, 500));
        throw new Exception("Format JSON invalide: " . json_last_error_msg());
    }
    
    error_log("Données décodées: " . print_r($data, true));
    
    // Vérifier si les données nécessaires sont présentes
    if (!isset($data['userId']) && !isset($data['user_id'])) {
        throw new Exception("Données incomplètes. 'userId' ou 'user_id' est requis");
    }
    
    // Récupérer l'ID utilisateur du bon champ
    $userId = isset($data['userId']) ? $data['userId'] : $data['user_id'];
    $exigences = isset($data['exigences']) ? $data['exigences'] : [];
    
    if (!is_array($exigences)) {
        error_log("Format d'exigences invalide: " . gettype($exigences) . " au lieu d'un tableau");
        error_log("Contenu: " . print_r($exigences, true));
        throw new Exception("Le champ 'exigences' doit être un tableau");
    }
    
    error_log("Synchronisation pour l'utilisateur: {$userId}");
    error_log("Nombre d'exigences: " . count($exigences));
    
    // Forcer l'utilisation de p71x6d_richard comme base de données pour tous
    $userId = "p71x6d_richard";
    error_log("ID forcé à: {$userId} pour la base de données");
    
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
        
        // Préparer l'insertion des exigences avec des paramètres nommés
        $stmt = $pdo->prepare("INSERT INTO `{$tableName}` (id, nom, responsabilites, exclusion, atteinte, groupId, date_creation) 
                              VALUES (:id, :nom, :resp, :excl, :att, :groupe, :date)");
        
        foreach ($exigences as $exigence) {
            // Vérifier que l'ID existe
            if (!isset($exigence['id'])) {
                error_log("Exigence sans ID trouvée, génération d'un UUID");
                $exigence['id'] = uniqid('exig_', true);
            }
            
            // Vérifier que le nom existe (au lieu de titre)
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
            
            // Option d'exclusion
            $exclusion = isset($exigence['exclusion']) ? (int)$exigence['exclusion'] : 0;
            
            // Liaison des paramètres
            $stmt->bindParam(':id', $exigence['id']);
            $stmt->bindParam(':nom', $nom);
            $stmt->bindParam(':resp', $responsabilites);
            $stmt->bindParam(':excl', $exclusion, PDO::PARAM_INT);
            $stmt->bindParam(':att', $exigence['atteinte']);
            $stmt->bindParam(':groupe', $exigence['groupId']);
            $stmt->bindParam(':date', $dateCreation);
            
            // Exécuter l'insertion
            $stmt->execute();
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
