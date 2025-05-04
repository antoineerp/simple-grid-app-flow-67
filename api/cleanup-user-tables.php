
<?php
// Forcer l'output buffering pour éviter tout output avant les headers
ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => 'Preflight OK']);
    exit;
}

// Journaliser l'appel
error_log("API cleanup-user-tables.php - Méthode: " . $_SERVER['REQUEST_METHOD'] . " - Requête: " . $_SERVER['REQUEST_URI']);

// Configuration de la base de données
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

// Liste des préfixes de tables à nettoyer pour un utilisateur
$tablePrefixes = [
    'documents_',
    'exigences_',
    'membres_',
    'bibliotheque_',
    'collaboration_',
    'collaboration_groups_',
    'test_'
];

try {
    // Nettoyer tout buffer de sortie existant
    if (ob_get_level()) ob_clean();
    
    // Vérifier que la requête est POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
        exit;
    }
    
    // Récupérer et valider les données
    $data = json_decode(file_get_contents("php://input"), true);
    error_log("Données reçues: " . json_encode($data));
    
    if (!$data || !isset($data['userId']) || !isset($data['confirmDelete']) || $data['confirmDelete'] !== true) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Données invalides ou confirmation manquante']);
        exit;
    }
    
    $userId = $data['userId'];
    
    // Valider l'identifiant utilisateur
    if (empty($userId) || strpos($userId, 'p71x6d_') !== 0) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error', 
            'message' => 'Identifiant utilisateur invalide',
            'userId' => $userId
        ]);
        exit;
    }
    
    // Connexion à la base de données
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    error_log("Tentative de connexion à la base de données pour nettoyage des tables");
    $pdo = new PDO($dsn, $username, $password, $options);
    error_log("Connexion réussie pour le nettoyage");
    
    // Récupérer toutes les tables de la base de données
    $tablesQuery = "SHOW TABLES";
    $stmt = $pdo->prepare($tablesQuery);
    $stmt->execute();
    $allTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $tablesToDelete = [];
    $deletedTables = [];
    $errors = [];
    
    // Identifier les tables spécifiques à l'utilisateur
    foreach ($allTables as $table) {
        foreach ($tablePrefixes as $prefix) {
            $userSpecificPrefix = $prefix . $userId;
            // Vérifier si la table appartient à l'utilisateur
            if (strpos($table, $userSpecificPrefix) === 0) {
                $tablesToDelete[] = $table;
                break;
            }
        }
    }
    
    error_log("Tables à supprimer pour l'utilisateur {$userId}: " . implode(", ", $tablesToDelete));
    
    // Supprimer les tables une par une
    foreach ($tablesToDelete as $table) {
        try {
            $dropQuery = "DROP TABLE `{$table}`";
            $pdo->exec($dropQuery);
            $deletedTables[] = $table;
            error_log("Table supprimée: {$table}");
        } catch (PDOException $e) {
            $errorMessage = "Erreur lors de la suppression de la table {$table}: " . $e->getMessage();
            error_log($errorMessage);
            $errors[] = $errorMessage;
        }
    }
    
    // Préparer la réponse
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'success' => true,
        'message' => count($deletedTables) . ' tables supprimées pour l\'utilisateur ' . $userId,
        'deletedTables' => $deletedTables,
        'errors' => $errors,
        'tablesFound' => count($tablesToDelete),
        'tablesDeleted' => count($deletedTables)
    ]);
    exit;
} catch (PDOException $e) {
    error_log("Erreur PDO lors du nettoyage des tables: " . $e->getMessage());
    
    if (ob_get_level()) ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
    exit;
} catch (Exception $e) {
    error_log("Erreur générale lors du nettoyage des tables: " . $e->getMessage());
    
    if (ob_get_level()) ob_clean();
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
    exit;
}
?>
