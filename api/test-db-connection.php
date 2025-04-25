
<?php
/**
 * Script simplifié de test de connexion à la base de données MySQL d'Infomaniak
 * Ce script effectue une connexion directe sans dépendances externes
 */

// Définir explicitement le type de contenu JSON et l'encodage UTF-8
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Désactiver l'affichage des erreurs PHP dans la sortie
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Journaliser l'accès pour débogage
error_log("=== EXÉCUTION DE test-db-connection.php ===");

// Paramètres de connexion directs (pour le test uniquement)
$host = "p71x6d.myd.infomaniak.com";
$dbname = "p71x6d_system";
$username = "p71x6d_system";
$password = "Trottinette43!";

// Créer un tampon de sortie pour capturer tout texte non-JSON
ob_start();

try {
    // Configuration DSN simplifiée
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 3 // Timeout court pour éviter les blocages
    ];
    
    // Journaliser la tentative
    error_log("Tentative de connexion à MySQL: $host, base $dbname, utilisateur $username");
    
    // Tenter la connexion
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Vérifier que la connexion fonctionne avec une requête simple
    $stmt = $pdo->query("SELECT 1 AS test_connection");
    $result = $stmt->fetch();
    
    if ($result && isset($result['test_connection'])) {
        // Nombre de tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $tableCount = count($tables);
        
        // Récupérer la version MySQL
        $versionStmt = $pdo->query("SELECT VERSION() AS version");
        $versionData = $versionStmt->fetch();
        $mysqlVersion = $versionData['version'] ?? 'Inconnue';
        
        // Vider le tampon qui pourrait contenir des messages d'erreur
        ob_end_clean();
        
        // Renvoyer un JSON valide indiquant le succès
        echo json_encode([
            'status' => 'success',
            'message' => 'Connexion à la base de données établie',
            'connection_time' => date('Y-m-d H:i:s'),
            'database' => [
                'host' => $host,
                'name' => $dbname,
                'tables_count' => $tableCount,
                'tables' => array_slice($tables, 0, 10), // Limiter à 10 tables pour éviter une réponse trop grande
                'mysql_version' => $mysqlVersion
            ]
        ], JSON_PRETTY_PRINT);
    } else {
        throw new Exception("La requête de test a échoué");
    }
    
} catch (PDOException $e) {
    // Vider le tampon
    ob_end_clean();
    
    // Journaliser l'erreur
    error_log("PDOException: " . $e->getMessage());
    
    // Renvoyer un JSON d'erreur standardisé
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Échec de la connexion à la base de données',
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
        'timestamp' => date('Y-m-d H:i:s'),
        'debug_info' => [
            'drivers_disponibles' => PDO::getAvailableDrivers(),
            'php_version' => PHP_VERSION
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Vider le tampon
    ob_end_clean();
    
    // Journaliser l'erreur
    error_log("Exception: " . $e->getMessage());
    
    // Renvoyer un JSON d'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du test de connexion',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>
