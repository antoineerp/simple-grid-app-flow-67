
<?php
header('Content-Type: text/html; charset=utf-8');

// Vérifier l'existence du fichier de configuration
$config_file = 'config/db_config.json';
$config_exists = file_exists($config_file);

// Traiter le formulaire si soumis
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save'])) {
    $config = [
        'host' => $_POST['host'] ?? 'p71x6d.myd.infomaniak.com',
        'db_name' => $_POST['db_name'] ?? 'p71x6d_richard',
        'username' => $_POST['username'] ?? 'p71x6d_richard',
        'password' => $_POST['password'] ?? 'Trottinette43!'
    ];
    
    // Créer le dossier config s'il n'existe pas
    if (!is_dir('config')) {
        mkdir('config', 0755, true);
    }
    
    // Sauvegarder la configuration
    $save_result = file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT));
    
    if ($save_result) {
        $message = "Configuration sauvegardée avec succès";
        $status = "success";
        $config_exists = true;
    } else {
        $message = "Erreur lors de la sauvegarde de la configuration";
        $status = "error";
    }
} else {
    // Charger la configuration existante
    if ($config_exists) {
        $config = json_decode(file_get_contents($config_file), true);
    } else {
        // Configuration par défaut pour Infomaniak
        $config = [
            'host' => 'p71x6d.myd.infomaniak.com',
            'db_name' => 'p71x6d_richard',
            'username' => 'p71x6d_richard',
            'password' => 'Trottinette43!'
        ];
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Configuration de la base de données</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input[type="text"], input[type="password"] { width: 100%; padding: 8px; box-sizing: border-box; }
        button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>Configuration de la base de données</h1>
    
    <?php if (isset($message)): ?>
        <p class="<?php echo $status; ?>"><?php echo $message; ?></p>
    <?php endif; ?>
    
    <form method="post" action="">
        <div class="form-group">
            <label for="host">Hôte:</label>
            <input type="text" id="host" name="host" value="<?php echo htmlspecialchars($config['host']); ?>" required>
        </div>
        
        <div class="form-group">
            <label for="db_name">Base de données:</label>
            <input type="text" id="db_name" name="db_name" value="<?php echo htmlspecialchars($config['db_name']); ?>" required>
        </div>
        
        <div class="form-group">
            <label for="username">Utilisateur:</label>
            <input type="text" id="username" name="username" value="<?php echo htmlspecialchars($config['username']); ?>" required>
        </div>
        
        <div class="form-group">
            <label for="password">Mot de passe:</label>
            <input type="password" id="password" name="password" value="<?php echo htmlspecialchars($config['password']); ?>" required>
        </div>
        
        <button type="submit" name="save">Sauvegarder</button>
    </form>
    
    <p><a href="../check-infomaniak.php">Retour à la vérification</a></p>
</body>
</html>
