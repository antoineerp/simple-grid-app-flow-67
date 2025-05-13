
<?php
// Fichier de diagnostic de configuration PHP
// Ce fichier tente de détecter les problèmes potentiels avec la configuration PHP

// Définir le type de contenu
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic de Configuration PHP</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Diagnostic de Configuration PHP</h1>
    <p>Ce script tente de déterminer pourquoi PHP ne s'exécute pas correctement sur votre serveur Infomaniak.</p>
    
    <div class="section">
        <h2>1. Version PHP et Serveur</h2>
        <p>
            Version PHP: <strong><?php echo phpversion(); ?></strong><br>
            Serveur: <strong><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></strong>
        </p>
    </div>
    
    <div class="section">
        <h2>2. Chemins et Fichiers</h2>
        <p>
            Document Root: <strong><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible'; ?></strong><br>
            Script: <strong><?php echo $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible'; ?></strong><br>
        </p>
        
        <h3>Vérification des fichiers importants:</h3>
        <ul>
            <?php
            $files = [
                '.htaccess' => dirname(__FILE__) . '/.htaccess',
                '.htaccess-force-php' => dirname(__FILE__) . '/.htaccess-force-php',
                '.user.ini' => dirname(__FILE__) . '/.user.ini',
                'php.ini' => dirname(__FILE__) . '/php.ini',
                'index.php' => dirname(__FILE__) . '/index.php'
            ];
            
            foreach ($files as $name => $path) {
                $exists = file_exists($path);
                $readable = is_readable($path);
                
                if ($exists && $readable) {
                    echo "<li class='success'>$name: Existe et lisible</li>";
                } elseif ($exists && !$readable) {
                    echo "<li class='warning'>$name: Existe mais non lisible</li>";
                } else {
                    echo "<li class='error'>$name: N'existe pas</li>";
                }
            }
            ?>
        </ul>
    </div>
    
    <div class="section">
        <h2>3. Configuration PHP</h2>
        <pre>
<?php
$iniSettings = [
    'display_errors', 'error_reporting', 'log_errors', 'error_log',
    'allow_url_fopen', 'allow_url_include',
    'disable_functions', 'open_basedir',
    'max_execution_time', 'memory_limit',
    'default_charset', 'default_mimetype'
];

foreach ($iniSettings as $setting) {
    echo $setting . ': ' . ini_get($setting) . "\n";
}
?>
        </pre>
    </div>
    
    <div class="section">
        <h2>4. Extensions PHP</h2>
        <pre>
<?php 
$extensions = get_loaded_extensions();
sort($extensions);
echo implode(', ', $extensions);
?>
        </pre>
    </div>
    
    <div class="section">
        <h2>5. Tests de fonctionnalité</h2>
        
        <h3>Test d'écriture dans un fichier:</h3>
        <?php
        $testFile = dirname(__FILE__) . '/test-write.txt';
        $writeSuccess = @file_put_contents($testFile, 'Test writing at ' . date('Y-m-d H:i:s'));
        
        if ($writeSuccess !== false) {
            echo "<p class='success'>Écriture réussie! (" . $writeSuccess . " octets)</p>";
        } else {
            echo "<p class='error'>Échec de l'écriture. Vérifiez les permissions.</p>";
        }
        ?>
        
        <h3>Test de création d'un fichier PHP:</h3>
        <?php
        $testPhpFile = dirname(__FILE__) . '/test-generated.php';
        $phpContent = "<?php\necho 'Cette page a été générée par config-diagnostic.php à ' . date('Y-m-d H:i:s');\n?>";
        $phpWriteSuccess = @file_put_contents($testPhpFile, $phpContent);
        
        if ($phpWriteSuccess !== false) {
            echo "<p class='success'>Fichier PHP créé avec succès! <a href='test-generated.php'>Tester</a></p>";
        } else {
            echo "<p class='error'>Échec de la création du fichier PHP.</p>";
        }
        ?>
    </div>
    
    <div class="section">
        <h2>6. Recommandations</h2>
        <p>Basé sur les résultats ci-dessus, voici quelques suggestions pour résoudre les problèmes d'exécution PHP:</p>
        
        <ol>
            <li>Contactez le support d'Infomaniak pour vérifier que PHP est correctement activé sur votre hébergement.</li>
            <li>Vérifiez que le type de fichier .php est bien associé au moteur PHP dans le panneau de configuration Infomaniak.</li>
            <li>Essayez de renommer le fichier .htaccess-force-php en .htaccess pour voir si cela résout le problème.</li>
            <li>Vérifiez si votre hébergement utilise PHP-FPM et si des configurations spécifiques sont nécessaires.</li>
        </ol>
    </div>
</body>
</html>
