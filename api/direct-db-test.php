
<?php
// Activer la journalisation d'erreurs plus détaillée
ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si c'est une requête OPTIONS (preflight), nous la terminons ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 200, 'message' => 'Preflight OK']);
    exit;
}

// Enregistrer le début de l'exécution
error_log("=== DÉBUT DE L'EXÉCUTION DE direct-db-test.php ===");

try {
    // Chargement des configurations d'environnement
    if (file_exists(__DIR__ . '/config/env.php')) {
        require_once __DIR__ . '/config/env.php';
    } else {
        throw new Exception("Le fichier env.php est manquant");
    }

    // Informations de connexion directement depuis env.php
    $host = DB_HOST;
    $dbname = DB_NAME;
    $username = DB_USER;
    $password = DB_PASS;
    
    // Vérifier qu'on utilise bien Infomaniak et jamais localhost
    if (strpos($host, 'infomaniak') === false || strpos($host, 'localhost') !== false) {
        error_log("Tentative d'utilisation d'un hôte non-Infomaniak détectée: $host");
        $host = "p71x6d.myd.infomaniak.com";
    }

    // Informations de connexion pour la réponse
    $connection_info = [
        'host' => $host,
        'database' => $dbname,
        'username' => $username,
        'php_version' => PHP_VERSION,
        'pdo_drivers' => implode(', ', PDO::getAvailableDrivers())
    ];

    // Tentative de connexion
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Récupérer la version de MySQL
    $stmt = $pdo->query('SELECT VERSION() as version');
    $version = $stmt->fetch()['version'];
    
    // Récupérer la liste des tables
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Récupérer un échantillon d'utilisateurs
    $utilisateurs_count = 0;
    $utilisateurs_sample = [];
    
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM utilisateurs');
        $utilisateurs_count = $stmt->fetch()['count'];
        
        // Récupérer quelques utilisateurs pour vérification
        $stmt = $pdo->query('SELECT id, identifiant_technique, email, role FROM utilisateurs LIMIT 5');
        $utilisateurs_sample = $stmt->fetchAll();
        
        // Vérifier et corriger les identifiants techniques
        foreach ($utilisateurs_sample as $key => $user) {
            if (empty($user['identifiant_technique']) || strpos($user['identifiant_technique'], 'p71x6d_') !== 0) {
                // Récupérer le nom complet
                $userStmt = $pdo->prepare("SELECT nom FROM utilisateurs WHERE id = ?");
                $userStmt->execute([$user['id']]);
                $userInfo = $userStmt->fetch();
                
                if ($userInfo) {
                    $identifiant_technique = 'p71x6d_' . preg_replace('/[^a-z0-9]/', '', strtolower($userInfo['nom']));
                    
                    // Mettre à jour l'utilisateur dans la base de données
                    $update = $pdo->prepare("UPDATE utilisateurs SET identifiant_technique = ? WHERE id = ?");
                    $update->execute([$identifiant_technique, $user['id']]);
                    
                    error_log("Identifiant technique corrigé pour l'utilisateur {$user['id']}: {$identifiant_technique}");
                    
                    // Mettre à jour l'échantillon
                    $utilisateurs_sample[$key]['identifiant_technique'] = $identifiant_technique;
                }
            }
        }
    } catch (PDOException $e) {
        // Ignorer cette erreur - la table peut ne pas exister
        error_log("Erreur lors de la récupération des utilisateurs: " . $e->getMessage());
    }
    
    // Récupérer la taille de la base de données
    $sizeInfo = '0 MB';
    try {
        $sizeStmt = $pdo->query("
            SELECT SUM(data_length + index_length) as size 
            FROM information_schema.TABLES 
            WHERE table_schema = '$dbname'
        ");
        $sizeData = $sizeStmt->fetch();
        if ($sizeData && isset($sizeData['size'])) {
            // Convertir en MB
            $sizeInfo = round(($sizeData['size'] / (1024 * 1024)), 2) . ' MB';
        }
    } catch (PDOException $e) {
        // Ignorer l'erreur
        error_log("Erreur lors de la récupération de la taille de la base: " . $e->getMessage());
    }
    
    // Réponse en cas de succès
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion à la base de données établie avec succès',
        'host' => $host,
        'database' => $dbname,
        'version' => $version,
        'tables' => $tables,
        'size' => $sizeInfo,
        'utilisateurs_count' => $utilisateurs_count,
        'utilisateurs_sample' => $utilisateurs_sample,
        'connection_info' => $connection_info
    ]);
    
} catch (PDOException $e) {
    // En cas d'erreur de connexion
    error_log("Erreur PDO: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage(),
        'connection_info' => isset($connection_info) ? $connection_info : null
    ]);
} catch (Exception $e) {
    // Autres erreurs
    error_log("Exception: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'connection_info' => isset($connection_info) ? $connection_info : [
            'php_version' => PHP_VERSION,
            'pdo_drivers' => implode(', ', PDO::getAvailableDrivers())
        ]
    ]);
}

error_log("=== FIN DE L'EXÉCUTION DE direct-db-test.php ===");
?>
