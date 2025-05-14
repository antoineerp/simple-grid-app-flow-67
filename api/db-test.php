
<?php
header('Content-Type: text/html; charset=utf-8');

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Fonction pour échapper l'affichage HTML
function h($text) {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

// Données de configuration
$config_file = __DIR__ . '/config/db_config.json';
$config = null;
$connection_error = null;
$db_tables = [];
$db_version = null;

// Lire le fichier de configuration
if (file_exists($config_file)) {
    $config_content = file_get_contents($config_file);
    $config = json_decode($config_content, true);
}

// Tester la connexion
if ($config) {
    try {
        $dsn = "mysql:host={$config['host']};dbname={$config['db_name']}";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3
        ];
        
        $pdo = new PDO($dsn, $config['username'], $config['password'], $options);
        
        // Obtenir la version MySQL
        $stmt = $pdo->query("SELECT VERSION() as version");
        $result = $stmt->fetch();
        $db_version = $result['version'];
        
        // Obtenir la liste des tables
        $stmt = $pdo->query("SHOW TABLES");
        $db_tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
    } catch (PDOException $e) {
        $connection_error = $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test de connexion à la base de données</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .info { background: #e6f7ff; border-left: 4px solid #1890ff; padding: 10px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Test de connexion à la base de données</h1>
    
    <h2>Configuration</h2>
    <?php if ($config): ?>
        <table>
            <tr>
                <th>Paramètre</th>
                <th>Valeur</th>
            </tr>
            <tr>
                <td>Hôte</td>
                <td><?php echo h($config['host']); ?></td>
            </tr>
            <tr>
                <td>Base de données</td>
                <td><?php echo h($config['db_name']); ?></td>
            </tr>
            <tr>
                <td>Utilisateur</td>
                <td><?php echo h($config['username']); ?></td>
            </tr>
            <tr>
                <td>Mot de passe</td>
                <td>[masqué]</td>
            </tr>
        </table>
    <?php else: ?>
        <p class="error">Fichier de configuration non trouvé ou invalide: <?php echo h($config_file); ?></p>
    <?php endif; ?>
    
    <h2>Résultat du test</h2>
    <?php if ($connection_error): ?>
        <p class="error">Échec de la connexion: <?php echo h($connection_error); ?></p>
        
        <div class="info">
            <p><strong>Suggestions:</strong></p>
            <ul>
                <li>Vérifiez que les informations de connexion sont correctes</li>
                <li>Vérifiez que le serveur MySQL est accessible depuis ce serveur</li>
                <li>Vérifiez que l'utilisateur a les permissions nécessaires</li>
                <li>Vérifiez que la base de données existe</li>
            </ul>
        </div>
    <?php else: ?>
        <p class="success">Connexion réussie!</p>
        <?php if ($db_version): ?>
            <p>Version MySQL: <?php echo h($db_version); ?></p>
        <?php endif; ?>
        
        <?php if (!empty($db_tables)): ?>
            <h3>Tables disponibles (<?php echo count($db_tables); ?>)</h3>
            <ul>
                <?php foreach ($db_tables as $table): ?>
                    <li><?php echo h($table); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php else: ?>
            <p>Aucune table trouvée dans la base de données.</p>
        <?php endif; ?>
    <?php endif; ?>
    
    <h2>Information PHP</h2>
    <p>PHP Version: <?php echo PHP_VERSION; ?></p>
    <p>Extensions PDO chargées: <?php echo implode(', ', PDO::getAvailableDrivers()); ?></p>
    
    <div>
        <p><a href="phpinfo.php">Voir toutes les informations PHP</a></p>
        <p><a href="../index.html">Retour à la page principale</a></p>
    </div>
</body>
</html>
