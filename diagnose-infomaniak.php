
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic Infomaniak pour Qualiopi.ch</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2 { color: #334155; }
        .section { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; }
        .success { color: #15803d; font-weight: 600; }
        .error { color: #b91c1c; font-weight: 600; }
        .warning { color: #b45309; font-weight: 600; }
        .monospace { font-family: monospace; background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
        pre { background-color: #f1f5f9; padding: 10px; border-radius: 4px; overflow: auto; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table, th, td { border: 1px solid #e2e8f0; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f1f5f9; }
    </style>
</head>
<body>
    <h1>Diagnostic Infomaniak pour Qualiopi.ch</h1>
    <p>Cet outil vérifie la configuration spécifique à l'hébergement Infomaniak.</p>
    
    <div class="section">
        <h2>1. Informations du Serveur</h2>
        <?php
        echo "<table>";
        echo "<tr><th>Variable</th><th>Valeur</th></tr>";
        echo "<tr><td>Serveur Web</td><td>" . $_SERVER['SERVER_SOFTWARE'] . "</td></tr>";
        echo "<tr><td>Document Root</td><td>" . $_SERVER['DOCUMENT_ROOT'] . "</td></tr>";
        echo "<tr><td>Script Filename</td><td>" . $_SERVER['SCRIPT_FILENAME'] . "</td></tr>";
        echo "<tr><td>Request URI</td><td>" . $_SERVER['REQUEST_URI'] . "</td></tr>";
        echo "<tr><td>Host</td><td>" . $_SERVER['HTTP_HOST'] . "</td></tr>";
        echo "<tr><td>PHP Version</td><td>" . phpversion() . "</td></tr>";
        echo "<tr><td>Répertoire courant</td><td>" . getcwd() . "</td></tr>";
        echo "</table>";
        
        // Vérifier si nous sommes sur Infomaniak
        $isInfomaniak = strpos($_SERVER['DOCUMENT_ROOT'] ?? '', '/home/clients') !== false;
        echo "<p>Détection Infomaniak: <strong>" . ($isInfomaniak ? '<span class="success">Oui</span>' : '<span class="warning">Non</span>') . "</strong></p>";
        ?>
    </div>
    
    <div class="section">
        <h2>2. Configuration de Base de Données</h2>
        <?php
        $db_config_file = 'api/config/db_config.json';
        $env_file = 'api/config/env.php';
        
        echo "<h3>Fichier db_config.json:</h3>";
        if (file_exists($db_config_file)) {
            $db_config = json_decode(file_get_contents($db_config_file), true);
            echo "<table>";
            echo "<tr><th>Paramètre</th><th>Valeur</th></tr>";
            foreach ($db_config as $key => $value) {
                // Masquer le mot de passe
                if ($key === 'password') {
                    $displayValue = str_repeat('*', strlen($value));
                } else {
                    $displayValue = $value;
                }
                echo "<tr><td>{$key}</td><td>{$displayValue}</td></tr>";
            }
            echo "</table>";
            
            echo "<p>Base de données configurée: <span class='success'>" . $db_config['db_name'] . "</span></p>";
            echo "<p>Utilisateur configuré: <span class='success'>" . $db_config['username'] . "</span></p>";
            
            // Vérifier si les valeurs sont conformes à ce qui est attendu
            if ($db_config['db_name'] === 'p71x6d_richard' && $db_config['username'] === 'p71x6d_richard') {
                echo "<p class='success'>✓ Configuration de base de données correcte pour Infomaniak</p>";
            } else {
                echo "<p class='error'>✗ Configuration de base de données incorrecte. Attendu: p71x6d_richard</p>";
            }
        } else {
            echo "<p class='error'>Fichier de configuration DB non trouvé!</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>3. Test de Connexion à la Base de Données</h2>
        <?php
        try {
            // Récupérer les informations de connexion du fichier de configuration
            if (file_exists($db_config_file)) {
                $config = json_decode(file_get_contents($db_config_file), true);
                $host = $config['host'];
                $db_name = $config['db_name'];
                $username = $config['username'];
                $password = $config['password'];
                
                // Tenter une connexion PDO
                $dsn = "mysql:host={$host};dbname={$db_name};charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                
                echo "<p>Tentative de connexion à: <span class='monospace'>{$host}</span></p>";
                
                $pdo = new PDO($dsn, $username, $password, $options);
                echo "<p class='success'>✓ Connexion à la base de données réussie!</p>";
                
                // Vérifier la version de MySQL
                $stmt = $pdo->query("SELECT VERSION() as version");
                $dbVersion = $stmt->fetch()['version'];
                echo "<p>Version MySQL: <span class='success'>{$dbVersion}</span></p>";
                
                // Lister les tables
                $stmt = $pdo->query("SHOW TABLES");
                $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                echo "<h3>Tables disponibles (" . count($tables) . "):</h3>";
                echo "<ul>";
                foreach (array_slice($tables, 0, 10) as $table) {
                    echo "<li>{$table}</li>";
                }
                if (count($tables) > 10) {
                    echo "<li>... et " . (count($tables) - 10) . " autres tables</li>";
                }
                echo "</ul>";
            } else {
                echo "<p class='error'>Fichier de configuration non trouvé</p>";
            }
        } catch (PDOException $e) {
            echo "<p class='error'>Erreur de connexion: " . $e->getMessage() . "</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>4. Vérification des Chemins</h2>
        <?php
        // Vérifier les chemins spécifiques à Infomaniak
        $infoPath = '/home/clients/df8dceff557ccc0605d45e1581aa661b';
        $sitePath = $infoPath . '/sites/qualiopi.ch';
        
        echo "<p>Chemin Infomaniak: <span class='monospace'>{$infoPath}</span> - ";
        if (file_exists($infoPath)) {
            echo "<span class='success'>Existe</span>";
        } else {
            echo "<span class='error'>N'existe pas</span>";
        }
        echo "</p>";
        
        echo "<p>Chemin du site: <span class='monospace'>{$sitePath}</span> - ";
        if (file_exists($sitePath)) {
            echo "<span class='success'>Existe</span>";
        } else {
            echo "<span class='error'>N'existe pas</span>";
        }
        echo "</p>";
        
        // Vérifier les dossiers clés
        $folders = [
            'assets' => 'Dossier des assets',
            'api' => 'Dossier API',
            'public/lovable-uploads' => 'Dossier des uploads'
        ];
        
        echo "<h3>Dossiers importants:</h3>";
        echo "<table>";
        echo "<tr><th>Dossier</th><th>Description</th><th>Statut</th><th>Contenu</th></tr>";
        
        foreach ($folders as $folder => $desc) {
            echo "<tr>";
            echo "<td class='monospace'>{$folder}</td>";
            echo "<td>{$desc}</td>";
            
            if (is_dir($folder)) {
                echo "<td class='success'>Existe</td>";
                $files = scandir($folder);
                $fileCount = count($files) - 2; // Moins . et ..
                echo "<td>{$fileCount} fichier(s)</td>";
            } else {
                echo "<td class='error'>N'existe pas</td>";
                echo "<td>-</td>";
            }
            
            echo "</tr>";
        }
        
        echo "</table>";
        ?>
    </div>
    
    <div class="section">
        <h2>5. Recommandations</h2>
        <p>Sur la base des résultats de diagnostic ci-dessus:</p>
        
        <ol>
            <li>Assurez-vous que les chemins dans votre frontend pointent vers /api pour l'API</li>
            <li>Confirmez que les fichiers .htaccess sont correctement configurés pour Infomaniak</li>
            <li>Vérifiez que la configuration de base de données utilise bien p71x6d_richard comme nom d'utilisateur et base de données</li>
        </ol>
        
        <p>Si vous avez des problèmes avec cette application, n'hésitez pas à consulter la documentation ou contacter le support.</p>
    </div>
</body>
</html>
