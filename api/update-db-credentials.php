
<?php
header('Content-Type: text/html; charset=utf-8');

// Si le formulaire est soumis
$updated = false;
$error = null;
$testResult = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update'])) {
    try {
        // Récupérer les nouvelles valeurs
        $host = $_POST['host'] ?? 'p71x6d.myd.infomaniak.com';
        $db_name = $_POST['db_name'] ?? 'p71x6d_richard';
        $username = $_POST['username'] ?? 'p71x6d_richard';
        $password = $_POST['password'] ?? '';
        
        // Tester la connexion avec les nouvelles valeurs
        $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, $username, $password, $options);
        
        // Si la connexion réussit, mettre à jour le fichier db_config.json
        $config = [
            'host' => $host,
            'db_name' => $db_name,
            'username' => $username,
            'password' => $password
        ];
        
        $configPath = __DIR__ . '/config/db_config.json';
        file_put_contents($configPath, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        // Mettre à jour env.php si possible
        $envPath = __DIR__ . '/config/env.php';
        if (file_exists($envPath) && is_writable($envPath)) {
            $envContent = file_get_contents($envPath);
            $envContent = preg_replace("/define\('DB_HOST', '.*?'\);/", "define('DB_HOST', '{$host}');", $envContent);
            $envContent = preg_replace("/define\('DB_NAME', '.*?'\);/", "define('DB_NAME', '{$db_name}');", $envContent);
            $envContent = preg_replace("/define\('DB_USER', '.*?'\);/", "define('DB_USER', '{$username}');", $envContent);
            $envContent = preg_replace("/define\('DB_PASS', '.*?'\);/", "define('DB_PASS', '{$password}');", $envContent);
            file_put_contents($envPath, $envContent);
        }
        
        $updated = true;
        $testResult = [
            'success' => true,
            'message' => 'Connexion réussie et configuration mise à jour'
        ];
    } catch (Exception $e) {
        $error = $e->getMessage();
        $testResult = [
            'success' => false,
            'message' => 'Erreur de connexion: ' . $error
        ];
    }
}

// Charger la configuration actuelle
$configPath = __DIR__ . '/config/db_config.json';
$config = [];
if (file_exists($configPath)) {
    $json = file_get_contents($configPath);
    $config = json_decode($json, true);
}

// Valeurs par défaut
$host = $config['host'] ?? 'p71x6d.myd.infomaniak.com';
$db_name = $config['db_name'] ?? 'p71x6d_richard';
$username = $config['username'] ?? 'p71x6d_richard';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mise à jour des Identifiants de Base de Données</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        button {
            background-color: #4a6da7;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #3a5d97;
        }
        .alert {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .alert-danger {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
        }
        .info-box {
            background-color: #e7f3fe;
            padding: 15px;
            border-left: 4px solid #2196F3;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Mise à jour des Identifiants de Base de Données</h1>
        
        <?php if ($updated): ?>
        <div class="alert alert-success">
            <strong>Succès!</strong> La configuration de la base de données a été mise à jour.
        </div>
        <?php endif; ?>
        
        <?php if ($error): ?>
        <div class="alert alert-danger">
            <strong>Erreur!</strong> <?php echo htmlspecialchars($error); ?>
        </div>
        <?php endif; ?>
        
        <div class="info-box">
            <h3>Informations importantes</h3>
            <p>Ce formulaire met à jour vos informations de connexion à la base de données MySQL Infomaniak. Assurez-vous d'entrer les bonnes informations pour éviter des problèmes d'accès.</p>
            <p>Les informations sont stockées dans le fichier <code>api/config/db_config.json</code> et, si possible, dans <code>api/config/env.php</code>.</p>
        </div>
        
        <form method="post" action="">
            <div class="form-group">
                <label for="host">Hôte MySQL:</label>
                <input type="text" id="host" name="host" value="<?php echo htmlspecialchars($host); ?>" required>
            </div>
            
            <div class="form-group">
                <label for="db_name">Nom de la base de données:</label>
                <input type="text" id="db_name" name="db_name" value="<?php echo htmlspecialchars($db_name); ?>" required>
            </div>
            
            <div class="form-group">
                <label for="username">Nom d'utilisateur MySQL:</label>
                <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($username); ?>" required>
            </div>
            
            <div class="form-group">
                <label for="password">Mot de passe MySQL:</label>
                <input type="password" id="password" name="password" placeholder="Entrez le mot de passe" required>
            </div>
            
            <button type="submit" name="update">Tester et mettre à jour</button>
        </form>
        
        <?php if ($testResult): ?>
        <div class="alert <?php echo $testResult['success'] ? 'alert-success' : 'alert-danger'; ?>" style="margin-top: 20px;">
            <strong><?php echo $testResult['success'] ? 'Test réussi:' : 'Échec du test:'; ?></strong> 
            <?php echo htmlspecialchars($testResult['message']); ?>
        </div>
        <?php endif; ?>
    </div>
    
    <div class="footer">
        <p><a href="infomaniak-db-diagnostic.php">Exécuter le diagnostic complet</a> | <a href="/">Retour à l'accueil</a></p>
    </div>
</body>
</html>
