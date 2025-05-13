
<?php
// Fichier pour tester la connexion directe à la base de données
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Activer l'affichage des erreurs
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Fonction pour nettoyer la sortie
function clean_buffer() {
    while (ob_get_level()) {
        ob_end_clean();
    }
}

// Démarrer un buffer pour éviter les problèmes d'output
ob_start();

try {
    // Paramètres de connexion à la base de données
    $host = "p71x6d.myd.infomaniak.com";
    $dbname = "p71x6d_system";
    $username = "p71x6d_system";
    $password = "Trottinette43!";
    
    // Connexion PDO avec gestion des erreurs et timeout
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ];
    
    // Tenter la connexion
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Vérifier l'utilisateur antcirier@gmail.com
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute(['antcirier@gmail.com']);
    $user = $stmt->fetch();
    
    // Nettoyer le buffer
    clean_buffer();
    
    // Envoyer la réponse
    echo json_encode([
        'status' => 'success',
        'message' => 'Connexion à la base de données réussie',
        'user_exists' => $user ? true : false,
        'server_info' => [
            'php_version' => phpversion(),
            'pdo_drivers' => PDO::getAvailableDrivers(),
            'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    // Nettoyer le buffer en cas d'erreur
    clean_buffer();
    
    // Envoyer l'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur de connexion à la base de données',
        'error' => $e->getMessage(),
        'error_code' => $e->getCode(),
        'server_info' => [
            'php_version' => phpversion(),
            'pdo_drivers' => PDO::getAvailableDrivers() 
        ]
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    // Nettoyer le buffer en cas d'erreur
    clean_buffer();
    
    // Envoyer l'erreur
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Erreur inattendue',
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}

// Fin du script
ob_end_flush();
?>
