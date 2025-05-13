
<?php
// Fichier de diagnostic pour forcer l'exécution PHP sur Infomaniak
header("Content-Type: text/html; charset=UTF-8");
header("X-PHP-Response: Executed");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic PHP - Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; }
        .section { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Diagnostic d'exécution PHP sur Infomaniak</h1>
    
    <div class="section">
        <h2>Test d'exécution PHP</h2>
        <?php if (function_exists('phpversion')): ?>
            <p class="success">PHP s'exécute correctement! Version: <?php echo phpversion(); ?></p>
        <?php else: ?>
            <p class="error">PHP ne s'exécute pas correctement.</p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Configuration du serveur</h2>
        <ul>
            <li>Serveur: <strong><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></strong></li>
            <li>Document Root: <strong><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible'; ?></strong></li>
            <li>Adresse IP serveur: <strong><?php echo $_SERVER['SERVER_ADDR'] ?? 'Non disponible'; ?></strong></li>
            <li>Port serveur: <strong><?php echo $_SERVER['SERVER_PORT'] ?? 'Non disponible'; ?></strong></li>
            <li>Méthode d'authentification PHP: <strong><?php echo php_sapi_name(); ?></strong></li>
        </ul>
    </div>

    <div class="section">
        <h2>Extensions PHP</h2>
        <pre><?php echo implode(', ', get_loaded_extensions()); ?></pre>
    </div>
    
    <div class="section">
        <h2>Test de connexion à la base de données</h2>
        <?php
        try {
            $host = "p71x6d.myd.infomaniak.com";
            $dbname = "p71x6d_system";
            $username = "p71x6d_system";
            $password = "Trottinette43!";
            
            $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5
            ];
            
            $pdo = new PDO($dsn, $username, $password, $options);
            echo "<p class='success'>Connexion à la base de données réussie!</p>";
            
            // Test d'exécution d'une requête simple
            $stmt = $pdo->query("SELECT COUNT(*) FROM users");
            $count = $stmt->fetchColumn();
            echo "<p>Nombre d'utilisateurs dans la table: <strong>$count</strong></p>";
        } catch (PDOException $e) {
            echo "<p class='error'>Erreur de connexion à la base de données: " . $e->getMessage() . "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Configuration du .htaccess</h2>
        <p>Essayons de créer un fichier .htaccess pour forcer l'exécution PHP:</p>
        <?php
        $htaccess_content = "
AddHandler application/x-httpd-php .php
AddHandler fcgid-script .php
AddHandler php8-fcgi .php

<FilesMatch \"\\.php$\">
    SetHandler application/x-httpd-php
</FilesMatch>

Options +ExecCGI
";

        $htaccess_path = __DIR__ . '/.htaccess-force';
        $success = file_put_contents($htaccess_path, $htaccess_content);
        
        if ($success !== false) {
            echo "<p class='success'>Fichier .htaccess-force créé avec succès à: $htaccess_path</p>";
            echo "<p>Pour l'utiliser, renommez-le en .htaccess</p>";
        } else {
            echo "<p class='error'>Impossible de créer le fichier .htaccess-force</p>";
        }
        ?>
        
        <h3>Contenu recommandé pour .htaccess:</h3>
        <pre><?php echo htmlspecialchars($htaccess_content); ?></pre>
    </div>
    
    <div class="section">
        <h2>Configuration du fichier php.ini</h2>
        <p>Essayons de créer un fichier .user.ini pour forcer la configuration PHP:</p>
        <?php
        $user_ini_content = "
; Force PHP à s'exécuter
engine = On
display_errors = On
error_reporting = E_ALL
default_charset = \"UTF-8\"
";

        $user_ini_path = __DIR__ . '/.user.ini-force';
        $success = file_put_contents($user_ini_path, $user_ini_content);
        
        if ($success !== false) {
            echo "<p class='success'>Fichier .user.ini-force créé avec succès à: $user_ini_path</p>";
            echo "<p>Pour l'utiliser, renommez-le en .user.ini</p>";
        } else {
            echo "<p class='error'>Impossible de créer le fichier .user.ini-force</p>";
        }
        ?>
        
        <h3>Contenu recommandé pour .user.ini:</h3>
        <pre><?php echo htmlspecialchars($user_ini_content); ?></pre>
    </div>
    
    <div class="section">
        <h2>Solutions recommandées</h2>
        <ol>
            <li>Contactez le support technique d'Infomaniak et demandez-leur explicitement d'activer l'exécution PHP sur votre hébergement.</li>
            <li>Dans le panel d'administration Infomaniak, vérifiez les paramètres PHP pour votre site.</li>
            <li>Essayez de renommer .htaccess-force en .htaccess et .user.ini-force en .user.ini</li>
            <li>Si rien ne fonctionne, demandez au support de vérifier le gestionnaire MIME pour les fichiers .php</li>
        </ol>
    </div>
</body>
</html>
