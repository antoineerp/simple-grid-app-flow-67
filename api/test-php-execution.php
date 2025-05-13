
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test d'exécution PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .code { background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Test d'exécution PHP</h1>
    
    <?php if (function_exists('phpversion')): ?>
        <p class="success">PHP s'exécute correctement sur ce fichier!</p>
        <p>Version PHP: <?php echo phpversion(); ?></p>
        <p>Heure du serveur: <?php echo date('Y-m-d H:i:s'); ?></p>
    <?php else: ?>
        <p class="error">PHP ne s'exécute pas correctement.</p>
    <?php endif; ?>
    
    <div>
        <h2>Extensions PHP chargées:</h2>
        <div class="code">
            <?php 
            if (function_exists('get_loaded_extensions')) {
                $extensions = get_loaded_extensions();
                sort($extensions);
                echo implode(', ', $extensions);
            } else {
                echo "Impossible de vérifier les extensions.";
            }
            ?>
        </div>
    </div>

    <div>
        <h2>Fichiers .htaccess existants:</h2>
        <?php
        $htaccess_files = [
            './' => '.htaccess à la racine',
            './api/' => '.htaccess dans api',
        ];
        
        echo "<ul>";
        foreach ($htaccess_files as $path => $desc) {
            $full_path = $path . '.htaccess';
            if (file_exists($full_path)) {
                echo "<li class='success'>{$desc}: Existe (" . filesize($full_path) . " octets)</li>";
            } else {
                echo "<li class='error'>{$desc}: N'existe pas</li>";
            }
        }
        echo "</ul>";
        ?>
    </div>
    
    <div>
        <h2>Solution pour activer PHP</h2>
        <p>Si ce script s'affiche correctement mais que d'autres scripts PHP ne fonctionnent pas, essayez de:</p>
        <ol>
            <li>Vérifier que le fichier .htaccess à la racine contient les bonnes directives</li>
            <li>Créer un fichier .htaccess dans chaque répertoire où PHP ne s'exécute pas</li>
            <li>Contacter le support Infomaniak pour activer PHP sur votre hébergement</li>
        </ol>
        
        <h3>Contenu recommandé pour .htaccess:</h3>
        <pre class="code">
AddHandler application/x-httpd-php .php
AddHandler fcgid-script .php
AddHandler php8-fcgi .php

&lt;FilesMatch "\.php$"&gt;
    SetHandler application/x-httpd-php
&lt;/FilesMatch&gt;

Options +ExecCGI
        </pre>
    </div>
</body>
</html>
