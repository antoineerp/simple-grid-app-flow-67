
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Vérification des types MIME</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .box { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Diagnostic des types MIME</h1>
    
    <div class="box">
        <h2>Configuration serveur</h2>
        <p>Serveur: <?php echo $_SERVER['SERVER_SOFTWARE']; ?></p>
        <p>PHP Version: <?php echo phpversion(); ?></p>
        <p>Document root: <?php echo $_SERVER['DOCUMENT_ROOT']; ?></p>
    </div>
    
    <div class="box">
        <h2>Test de configuration .htaccess</h2>
        <?php
        $htaccess_root = file_exists('../.htaccess');
        $htaccess_api = file_exists('./.htaccess');
        
        echo '<p>Fichier .htaccess racine: ' . 
             ($htaccess_root ? '<span class="success">Trouvé</span>' : '<span class="error">Non trouvé</span>') . '</p>';
        
        echo '<p>Fichier .htaccess API: ' . 
             ($htaccess_api ? '<span class="success">Trouvé</span>' : '<span class="error">Non trouvé</span>') . '</p>';
             
        if ($htaccess_root) {
            $content = file_get_contents('../.htaccess');
            $has_js_mime = strpos($content, 'application/javascript') !== false;
            echo '<p>Configuration MIME JavaScript dans .htaccess: ' . 
                 ($has_js_mime ? '<span class="success">Trouvée</span>' : '<span class="error">Non trouvée</span>') . '</p>';
        }
        ?>
    </div>
    
    <div class="box">
        <h2>Test de fichier JavaScript</h2>
        <p>Créez un fichier de test JavaScript et vérifiez s'il est servi avec le bon type MIME.</p>
        <p><a href="/mime-test.html" target="_blank">Tester le chargement de module JS</a></p>
    </div>
    
    <div class="box">
        <h2>Instructions pour résoudre le problème</h2>
        <ol>
            <li>Assurez-vous que les fichiers <code>.htaccess</code> sont correctement configurés.</li>
            <li>Vérifiez que votre serveur supporte la réécriture d'URL et les en-têtes personnalisés.</li>
            <li>Si vous utilisez Apache, assurez-vous que le module <code>mod_headers</code> est activé.</li>
            <li>Si le problème persiste après ces modifications, essayez de vider le cache de votre navigateur.</li>
        </ol>
    </div>
</body>
</html>
