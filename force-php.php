
<?php
// Script pour forcer et vérifier l'exécution PHP
header('Content-Type: text/html; charset=utf-8');

// Récupérer les informations sur la configuration
$php_info = [
    'version' => phpversion(),
    'sapi' => php_sapi_name(),
    'extensions' => get_loaded_extensions(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    'current_path' => __FILE__
];

// Vérifier les fichiers .htaccess
$htaccess_root = file_exists('.htaccess') ? file_get_contents('.htaccess') : 'Non trouvé';
$htaccess_api = file_exists('api/.htaccess') ? file_get_contents('api/.htaccess') : 'Non trouvé';

// Essayer de créer un fichier test dans le dossier API
$test_file = 'api/test_' . time() . '.php';
$test_content = '<?php echo json_encode(["status" => "success", "message" => "PHP working!"]); ?>';
$write_success = file_put_contents($test_file, $test_content);

// Vérifier les permissions
$permissions = [
    'api_dir' => substr(sprintf('%o', fileperms('api')), -4),
    'api_index' => file_exists('api/index.php') ? substr(sprintf('%o', fileperms('api/index.php')), -4) : 'Non trouvé',
    'htaccess' => file_exists('.htaccess') ? substr(sprintf('%o', fileperms('.htaccess')), -4) : 'Non trouvé'
];

// Récupérer les modules Apache chargés si possible
$apache_modules = function_exists('apache_get_modules') ? apache_get_modules() : ['Apache modules not available'];

// Afficher la page HTML
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic d'exécution PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .success { color: green; }
        .error { color: red; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        button { padding: 10px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #45a049; }
    </style>
</head>
<body>
    <h1>Diagnostic d'exécution PHP</h1>
    
    <div class="section">
        <h2>Informations PHP</h2>
        <ul>
            <li><strong>Version PHP:</strong> <?php echo $php_info['version']; ?></li>
            <li><strong>SAPI:</strong> <?php echo $php_info['sapi']; ?></li>
            <li><strong>Serveur:</strong> <?php echo $php_info['server_software']; ?></li>
            <li><strong>Document Root:</strong> <?php echo $php_info['document_root']; ?></li>
            <li><strong>Script:</strong> <?php echo $php_info['script_filename']; ?></li>
            <li><strong>Chemin actuel:</strong> <?php echo $php_info['current_path']; ?></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Extensions PHP</h2>
        <pre><?php echo implode(', ', $php_info['extensions']); ?></pre>
    </div>
    
    <div class="section">
        <h2>Permissions</h2>
        <ul>
            <li><strong>Dossier API:</strong> <?php echo $permissions['api_dir']; ?></li>
            <li><strong>API index.php:</strong> <?php echo $permissions['api_index']; ?></li>
            <li><strong>.htaccess:</strong> <?php echo $permissions['htaccess']; ?></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Modules Apache</h2>
        <pre><?php echo implode(', ', $apache_modules); ?></pre>
    </div>
    
    <div class="section">
        <h2>Fichier .htaccess (racine)</h2>
        <pre><?php echo htmlspecialchars($htaccess_root); ?></pre>
    </div>
    
    <div class="section">
        <h2>Fichier .htaccess (API)</h2>
        <pre><?php echo htmlspecialchars($htaccess_api); ?></pre>
    </div>
    
    <div class="section">
        <h2>Test d'écriture de fichier</h2>
        <?php if($write_success): ?>
            <p class="success">Fichier de test créé avec succès: <?php echo $test_file; ?></p>
            <p>Accédez à <a href="<?php echo $test_file; ?>" target="_blank"><?php echo $test_file; ?></a> pour vérifier l'exécution PHP.</p>
        <?php else: ?>
            <p class="error">Impossible de créer le fichier de test. Vérifiez les permissions.</p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Actions correctives</h2>
        <p>Si PHP ne s'exécute pas correctement, essayez ces actions :</p>
        <ol>
            <li>Vérifiez que le module PHP est activé sur votre serveur</li>
            <li>Vérifiez que les droits d'exécution sont corrects</li>
            <li>Contactez votre hébergeur pour vérifier la configuration PHP</li>
            <li>Essayez de redémarrer votre serveur web</li>
        </ol>
    </div>
    
    <button onclick="window.location.reload()">Rafraîchir le diagnostic</button>
</body>
</html>
