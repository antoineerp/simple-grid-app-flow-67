
<?php
// Page d'accueil pour les diagnostics
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic du site FormaCert</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .diagnostic-tools { background-color: #f5f5f5; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .diagnostic-tools a { display: block; margin-bottom: 10px; color: #2980b9; text-decoration: none; padding: 8px; border-radius: 4px; }
        .diagnostic-tools a:hover { background-color: #eaeaea; text-decoration: underline; }
        .section { margin-bottom: 30px; }
        .info { background-color: #e1f5fe; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .warning { background-color: #fff3e0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .success { color: green; }
        .error { color: red; }
        pre { background-color: #f8f9fa; padding: 10px; border-radius: 5px; overflow: auto; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
        @media (max-width: 768px) {
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <h1>Diagnostic du site FormaCert</h1>
    
    <div class="info">
        <p><strong>Page de diagnostic système</strong> - Utilisez les outils ci-dessous pour identifier et résoudre les problèmes de configuration.</p>
    </div>
    
    <div class="section">
        <h2>Outils de diagnostic disponibles</h2>
        <div class="grid">
            <div class="card">
                <h3>Tests système</h3>
                <div class="diagnostic-tools">
                    <a href="/api/system-check.php">Diagnostic système complet</a>
                    <a href="/api/phpinfo.php">Informations PHP (phpinfo)</a>
                    <a href="/api/php-execution-test.php">Test d'exécution PHP</a>
                    <a href="/api/php-system-check.php">Vérification de la configuration PHP</a>
                </div>
            </div>
            
            <div class="card">
                <h3>Tests de ressources</h3>
                <div class="diagnostic-tools">
                    <a href="/api/assets-check.php">Vérification des assets</a>
                    <a href="/api/diagnose-assets.php">Diagnostic détaillé des assets</a>
                    <a href="/api/cors-test.php">Test CORS</a>
                </div>
            </div>
            
            <div class="card">
                <h3>Tests de base de données</h3>
                <div class="diagnostic-tools">
                    <a href="/api/db-connection-test.php">Test de connexion à la base de données</a>
                    <a href="/api/database-test.php">Test de la base de données</a>
                    <a href="/api/check-users.php">Vérification des utilisateurs</a>
                </div>
            </div>
            
            <div class="card">
                <h3>Outils de correction</h3>
                <div class="diagnostic-tools">
                    <a href="/fix-assets-runtime.php">Correction des références aux assets</a>
                    <a href="/fix-index-references.php">Correction des références dans index.html</a>
                    <a href="/api/generate-assets.php">Génération d'assets de test</a>
                </div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Informations système</h2>
        <pre>
Date du diagnostic: <?php echo date('Y-m-d H:i:s'); ?>

Version PHP: <?php echo phpversion(); ?>

Serveur: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non détecté'; ?>

Domaine: <?php echo $_SERVER['HTTP_HOST'] ?? 'Non détecté'; ?>

UserAgent: <?php echo $_SERVER['HTTP_USER_AGENT'] ?? 'Non détecté'; ?>

Document Root: <?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non détecté'; ?>

Script Name: <?php echo $_SERVER['SCRIPT_NAME'] ?? 'Non détecté'; ?>
        </pre>
    </div>
    
    <div class="section">
        <h2>Vérification rapide des fichiers critiques</h2>
        <ul>
            <li>Fichier index.html: <?php echo file_exists('../index.html') ? '<span class="success">Existe</span>' : '<span class="error">Manquant</span>'; ?></li>
            <li>Fichier .htaccess racine: <?php echo file_exists('../.htaccess') ? '<span class="success">Existe</span>' : '<span class="error">Manquant</span>'; ?></li>
            <li>Fichier .htaccess API: <?php echo file_exists('./.htaccess') ? '<span class="success">Existe</span>' : '<span class="error">Manquant</span>'; ?></li>
            <li>Fichier api/index.php: <?php echo file_exists('./index.php') ? '<span class="success">Existe</span>' : '<span class="error">Manquant</span>'; ?></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Actions recommandées</h2>
        <ol>
            <li>Exécutez le <a href="/api/system-check.php">diagnostic système complet</a> pour vérifier la configuration.</li>
            <li>Vérifiez les <a href="/api/assets-check.php">assets</a> pour vous assurer qu'ils sont correctement chargés.</li>
            <li>Si nécessaire, utilisez l'outil de <a href="/fix-assets-runtime.php">correction des références aux assets</a>.</li>
            <li>Testez la <a href="/api/db-connection-test.php">connexion à la base de données</a>.</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Liens d'application</h2>
        <ul>
            <li><a href="/">Page d'accueil de l'application</a></li>
            <li><a href="/api/">Point d'entrée de l'API</a></li>
        </ul>
    </div>
    
    <footer style="margin-top: 50px; text-align: center; color: #7f8c8d; font-size: 0.8em;">
        <p>FormaCert - Outil de diagnostic - <?php echo date('Y'); ?></p>
    </footer>
</body>
</html>
