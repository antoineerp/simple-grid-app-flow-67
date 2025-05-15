
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Transfert d'urgence des fichiers PHP</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; background-color: #f0fff0; padding: 10px; border-left: 3px solid green; }
        .error { color: red; background-color: #fff0f0; padding: 10px; border-left: 3px solid red; }
        .info { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
        code { background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #45a049; }
    </style>
</head>
<body>
    <h1>Transfert d'urgence des fichiers PHP</h1>
    
    <div class="info">
        <p>Cet outil vérifie et copie les fichiers PHP essentiels qui pourraient ne pas être transférés durant le déploiement.</p>
    </div>
    
    <?php
    $php_files = [
        'phpinfo.php',
        'index.php',
        'api/phpinfo.php',
        'api/index.php',
        'api/config/env.php',
        'api/config/db_config.json',
        'api/test.php',
        'api/check.php'
    ];
    
    if (isset($_POST['create_files'])) {
        echo "<h2>Création des fichiers PHP essentiels</h2>";
        
        // Création du fichier phpinfo.php à la racine
        file_put_contents('phpinfo.php', '<?php phpinfo(); ?>');
        
        // Création du fichier index.php à la racine
        file_put_contents('index.php', '<?php
// Redirection vers index.html
header("Location: index.html");
exit;
?>');
        
        // S'assurer que le répertoire api existe
        if (!is_dir('api')) {
            mkdir('api', 0755, true);
        }
        
        // Création du fichier phpinfo.php dans api/
        if (!is_dir('api')) {
            mkdir('api', 0755, true);
        }
        file_put_contents('api/phpinfo.php', '<?php phpinfo(); ?>');
        
        // Création du fichier index.php dans api/
        file_put_contents('api/index.php', '<?php
header("Content-Type: application/json");
echo json_encode(["status" => "ok", "message" => "API fonctionne correctement"]);
?>');
        
        // S'assurer que le répertoire api/config existe
        if (!is_dir('api/config')) {
            mkdir('api/config', 0755, true);
        }
        
        // Création du fichier env.php dans api/config/
        file_put_contents('api/config/env.php', '<?php
// Configuration des variables d\'environnement pour Infomaniak
define("DB_HOST", "p71x6d.myd.infomaniak.com");
define("DB_NAME", "p71x6d_richard");
define("DB_USER", "p71x6d_richard");
define("DB_PASS", "Trottinette43!");
define("API_BASE_URL", "/api");
define("APP_ENV", "production");

// Fonction d\'aide pour récupérer les variables d\'environnement
function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $default;
}

// Alias pour compatibilité avec différentes syntaxes
if (!function_exists(\'env\')) {
    function env($key, $default = null) {
        return get_env($key, $default);
    }
}
?>');
        
        // Création du fichier db_config.json dans api/config/
        file_put_contents('api/config/db_config.json', '{
    "host": "p71x6d.myd.infomaniak.com",
    "db_name": "p71x6d_richard",
    "username": "p71x6d_richard",
    "password": "Trottinette43!"
}');
        
        // Création du fichier test.php dans api/
        file_put_contents('api/test.php', '<?php
header("Content-Type: application/json");
echo json_encode([
    "status" => "ok", 
    "message" => "Test API réussi", 
    "timestamp" => date("Y-m-d H:i:s")
]);
?>');
        
        // Création du fichier check.php dans api/
        file_put_contents('api/check.php', '<?php
header("Content-Type: application/json");
echo json_encode([
    "status" => "ok", 
    "api" => "fonctionnelle", 
    "version" => "1.0", 
    "time" => date("Y-m-d H:i:s")
]);
?>');
        
        echo "<div class='success'>Fichiers PHP essentiels créés avec succès!</div>";
    }
    
    echo "<h2>Vérification des fichiers PHP existants</h2>";
    echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
    echo "<tr><th>Fichier</th><th>Existe</th><th>Taille</th><th>Dernière modification</th></tr>";
    
    foreach ($php_files as $file) {
        echo "<tr>";
        echo "<td><code>$file</code></td>";
        
        if (file_exists($file)) {
            echo "<td style='color:green;'>Oui</td>";
            echo "<td>" . filesize($file) . " octets</td>";
            echo "<td>" . date("Y-m-d H:i:s", filemtime($file)) . "</td>";
        } else {
            echo "<td style='color:red;'>Non</td>";
            echo "<td>-</td>";
            echo "<td>-</td>";
        }
        
        echo "</tr>";
    }
    
    echo "</table>";
    
    echo "<h2>Actions</h2>";
    echo "<form method='post'>";
    echo "<button type='submit' name='create_files'>Créer les fichiers manquants</button>";
    echo "</form>";
    
    echo "<h2>Correction du script de déploiement</h2>";
    echo "<p>Pour corriger le problème de transfert des fichiers PHP lors du déploiement, suivez ces étapes :</p>";
    echo "<ol>";
    echo "<li>Modifiez le fichier <code>deploy-simple.sh</code> pour vous assurer qu'il copie correctement tous les fichiers PHP.</li>";
    echo "<li>Vérififiez si dans le workflow GitHub Actions, la commande pour copier les fichiers PHP est correcte.</li>";
    echo "<li>Assurez-vous que les exclusions dans le paramètre <code>exclude</code> du FTP-Deploy-Action ne contiennent pas <code>*.php</code>.</li>";
    echo "</ol>";
    
    echo "<h3>Exemple de modification pour deploy-simple.sh</h3>";
    echo "<pre>
# Ajouter cette section dans deploy-simple.sh
echo \"Copie explicite des fichiers PHP essentiels...\"
mkdir -p deploy/api/config
cp index.php deploy/ 2>/dev/null || echo \"Création de index.php dans deploy/\"
echo '<?php header(\"Location: index.html\"); exit; ?>' > deploy/index.php
cp phpinfo.php deploy/ 2>/dev/null || echo \"<?php phpinfo(); ?>\" > deploy/phpinfo.php
cp api/index.php deploy/api/ 2>/dev/null || mkdir -p deploy/api && echo '<?php echo json_encode([\"status\" => \"ok\"]); ?>' > deploy/api/index.php
cp api/config/env.php deploy/api/config/ 2>/dev/null || echo \"Création manuelle de env.php\"
cp api/config/db_config.json deploy/api/config/ 2>/dev/null || echo \"Création manuelle de db_config.json\"
</pre>";
    
    echo "<h3>Liens utiles</h3>";
    echo "<ul>";
    echo "<li><a href='phpinfo.php'>Vérifier phpinfo.php</a></li>";
    echo "<li><a href='api/check.php'>Tester l'API</a></li>";
    echo "<li><a href='api/phpinfo.php'>Vérifier phpinfo.php dans api/</a></li>";
    echo "</ul>";
?>
</body>
</html>
