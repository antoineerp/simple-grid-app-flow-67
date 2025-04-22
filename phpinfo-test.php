
<?php
// Définir explicitement le type de contenu pour éviter les problèmes d'interprétation
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test PHP Info FormaCert</title>
    <style>
        body { font-family: sans-serif; margin: 20px; line-height: 1.5; }
        h1 { color: #333; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        hr { margin: 20px 0; border: 0; border-top: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>Test Configuration PHP FormaCert</h1>
    
    <h2>État de l'interprétation PHP</h2>
    <p class="success">Si vous voyez ce message formaté, PHP est interprété correctement!</p>
    
    <h2>Informations de base</h2>
    <pre>
Version PHP: <?php echo phpversion(); ?>

Date et heure: <?php echo date('Y-m-d H:i:s'); ?>

API PHP: <?php echo php_sapi_name(); ?>

Server Software: <?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible'; ?>
    </pre>
    
    <h2>Configuration .htaccess</h2>
    <pre>
État du fichier .htaccess principal: <?php echo file_exists('./.htaccess') ? 'Présent' : 'Absent'; ?>

État du fichier .htaccess API: <?php echo file_exists('./api/.htaccess') ? 'Présent' : 'Absent'; ?>
    </pre>

    <h2>Extensions PHP chargées</h2>
    <pre>
<?php 
$extensions = get_loaded_extensions();
sort($extensions);
foreach ($extensions as $ext) {
    echo "- $ext\n";
}
?>
    </pre>
    
    <h2>Fichiers de configuration PHP</h2>
    <pre>
Fichier php.ini chargé: <?php echo php_ini_loaded_file() ?: 'Aucun'; ?>

Fichiers .ini additionnels: <?php echo php_ini_scanned_files() ?: 'Aucun'; ?>
    </pre>
    
    <hr>
    
    <h2>Informations PHP complètes</h2>
    <div style="margin-top: 20px">
        <?php phpinfo(); ?>
    </div>
</body>
</html>
