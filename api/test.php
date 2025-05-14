
<?php
header('Content-Type: application/json');

// Activation des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    // Vérifier si le fichier de configuration existe
    $config_file = 'config/db_config.json';
    $config_exists = file_exists($config_file);
    
    // Charger la configuration si elle existe
    if ($config_exists) {
        $config = json_decode(file_get_contents($config_file), true);
        
        // Tester la connexion à la base de données
        $dsn = "mysql:host={$config['host']};dbname={$config['db_name']}";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3
        ];
        
        try {
            $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
            
            // Test réussi
            echo json_encode([
                'status' => 'success',
                'message' => 'API et connexion à la base de données fonctionnent correctement',
                'config' => [
                    'host' => $config['host'],
                    'db_name' => $config['db_name'],
                    'username' => $config['username']
                ]
            ]);
        } catch (PDOException $e) {
            // Erreur de connexion à la base de données
            echo json_encode([
                'status' => 'error',
                'message' => 'Erreur de connexion à la base de données',
                'error' => $e->getMessage(),
                'config' => [
                    'host' => $config['host'],
                    'db_name' => $config['db_name'],
                    'username' => $config['username']
                ]
            ]);
        }
    } else {
        // Configuration non trouvée
        echo json_encode([
            'status' => 'error',
            'message' => 'Fichier de configuration de base de données non trouvé',
            'path' => realpath($config_file) ?: 'N/A'
        ]);
    }
} catch (Exception $e) {
    // Erreur générale
    echo json_encode([
        'status' => 'error',
        'message' => 'Erreur lors du traitement de la requête',
        'error' => $e->getMessage()
    ]);
}
?>
