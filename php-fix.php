
<?php
// Afficher les informations de configuration PHP
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP</h1>
    
    <div class="section">
        <h2>Informations PHP</h2>
        <p>Version PHP: <strong><?php echo phpversion(); ?></strong></p>
        <p>Interface SAPI: <strong><?php echo php_sapi_name(); ?></strong></p>
        <p>Extensions chargées:</p>
        <pre><?php print_r(get_loaded_extensions()); ?></pre>
    </div>
    
    <div class="section">
        <h2>Configuration du serveur</h2>
        <p>SERVER_SOFTWARE: <strong><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?></strong></p>
        <p>DOCUMENT_ROOT: <strong><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible'; ?></strong></p>
        <p>SCRIPT_FILENAME: <strong><?php echo $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible'; ?></strong></p>
    </div>
    
    <div class="section">
        <h2>Configuration .htaccess</h2>
        <?php
        $htaccess_path = './.htaccess';
        if (file_exists($htaccess_path)) {
            echo '<p class="success">Le fichier .htaccess existe</p>';
            if (is_readable($htaccess_path)) {
                echo '<p>Contenu du fichier .htaccess:</p>';
                echo '<pre>' . htmlspecialchars(file_get_contents($htaccess_path)) . '</pre>';
            } else {
                echo '<p class="error">Le fichier .htaccess n\'est pas lisible</p>';
            }
        } else {
            echo '<p class="error">Le fichier .htaccess n\'existe pas</p>';
        }
        ?>
    </div>
    
    <div class="section">
        <h2>Actions correctives</h2>
        <a href="htaccess-fix.php" class="button">Réparer la configuration .htaccess</a>
    </div>
</body>
</html>
