
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
    
    // CORRECTION: Vérifier si la table existe en utilisant information_schema au lieu de SHOW TABLES LIKE
    $tableExistsQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?";
    $stmt = $pdo->prepare($tableExistsQuery);
    $stmt->execute([$dbname, $tableName]);
    $tableExists = (int)$stmt->fetchColumn() > 0;
    
    if (!$tableExists) {
        // Si la table n'existe pas, renvoyer un tableau vide
        error_log("Table {$tableName} n'existe pas, retour d'un tableau vide");
        echo json_encode([
            'success' => true,
            'membres' => [],
            'message' => 'Aucune donnée trouvée pour cet utilisateur'
        ]);
        exit;
    }
    
    // Récupérer les membres depuis la table sans utiliser de requête préparée pour le nom de table
    // Les noms de table ne peuvent pas être passés comme paramètres dans les requêtes préparées
    // Mais comme nous avons nettoyé l'identifiant, c'est sécurisé
    $query = "SELECT * FROM `{$tableName}` ORDER BY nom, prenom";
    error_log("Exécution de la requête: {$query}");
    
    // Exécuter la requête directement
    $stmt = $pdo->query($query);
    $membres = $stmt->fetchAll();
    
    // Formater les dates pour le client
    foreach ($membres as &$membre) {
        if (isset($membre['date_creation']) && $membre['date_creation']) {
            $membre['date_creation'] = date('Y-m-d\TH:i:s', strtotime($membre['date_creation']));
        }
        if (isset($membre['date_modification']) && $membre['date_modification']) {
            $membre['date_modification'] = date('Y-m-d\TH:i:s', strtotime($membre['date_modification']));
        }
    }
    
    error_log("Membres récupérés: " . count($membres));
    echo json_encode([
        'success' => true,
        'membres' => $membres,
        'count' => count($membres)
    ]);
    
} catch (PDOException $e) {
    error_log("Erreur PDO dans membres-load.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Exception dans membres-load.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    error_log("=== FIN DE L'EXÉCUTION DE membres-load.php ===");
    if (ob_get_level()) ob_end_flush();
}
