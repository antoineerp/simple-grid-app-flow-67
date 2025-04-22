
<?php
// Script de diagnostic pour identifier pourquoi PHP n'est pas exécuté
header('Content-Type: text/html; charset=utf-8');

// Collecter les informations de configuration du serveur
$server_info = [
    'PHP_VERSION' => PHP_VERSION,
    'SERVER_SOFTWARE' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non disponible',
    'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non disponible',
    'SCRIPT_FILENAME' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non disponible',
    'PHP_SAPI' => php_sapi_name(),
    'HANDLER' => $_SERVER['HANDLER'] ?? 'Non disponible',
    'REDIRECT_HANDLER' => $_SERVER['REDIRECT_HANDLER'] ?? 'Non disponible',
    'SERVER_PROTOCOL' => $_SERVER['SERVER_PROTOCOL'] ?? 'Non disponible'
];

// Tester les modules PHP chargés
$modules = get_loaded_extensions();
$important_modules = [
    'mysqli' => in_array('mysqli', $modules),
    'pdo_mysql' => in_array('pdo_mysql', $modules),
    'json' => in_array('json', $modules),
    'curl' => in_array('curl', $modules),
    'mbstring' => in_array('mbstring', $modules)
];

// Tester la configuration .htaccess
$htaccess_test = [];
$htaccess_root = file_exists('../.htaccess') ? 'Existe' : 'N\'existe pas';
$htaccess_api = file_exists('./.htaccess') ? 'Existe' : 'N\'existe pas';
$htaccess_root_content = file_exists('../.htaccess') ? file_get_contents('../.htaccess') : 'N/A';
$htaccess_api_content = file_exists('./.htaccess') ? file_get_contents('./.htaccess') : 'N/A';

// Tester l'exécution de PHP
$php_execution = function_exists('phpinfo') ? 'OK' : 'NON';

// Tester si le module rewrite est actif
$rewrite_module = function_exists('apache_get_modules') ? (in_array('mod_rewrite', apache_get_modules()) ? 'Actif' : 'Inactif') : 'Impossible à déterminer';

// Afficher le rapport HTML
echo '<!DOCTYPE html>
<html>
<head>
    <title>Diagnostic du serveur PHP</title>
    <style>
        body {font-family: Arial, sans-serif; margin: 20px; line-height: 1.6;}
        h1, h2 {color: #333;}
        .section {margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;}
        .success {color: green; font-weight: bold;}
        .error {color: red; font-weight: bold;}
        .warning {color: orange; font-weight: bold;}
        pre {background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;}
    </style>
</head>
<body>
    <h1>Diagnostic du serveur PHP</h1>
    
    <div class="section">
        <h2>Informations sur le serveur</h2>
        <ul>';
foreach($server_info as $key => $value) {
    echo "<li><strong>$key:</strong> $value</li>";
}
echo '</ul>
    </div>
    
    <div class="section">
        <h2>Modules PHP importants</h2>
        <ul>';
foreach($important_modules as $module => $loaded) {
    $status_class = $loaded ? 'success' : 'error';
    $status_text = $loaded ? 'Chargé' : 'Non chargé';
    echo "<li><strong>$module:</strong> <span class=\"$status_class\">$status_text</span></li>";
}
echo '</ul>
    </div>
    
    <div class="section">
        <h2>Configuration .htaccess</h2>
        <p><strong>Fichier .htaccess racine:</strong> ' . $htaccess_root . '</p>
        <p><strong>Fichier .htaccess API:</strong> ' . $htaccess_api . '</p>
        <p><strong>Module rewrite:</strong> ' . $rewrite_module . '</p>
        <h3>Contenu du .htaccess racine:</h3>
        <pre>' . htmlspecialchars($htaccess_root_content) . '</pre>
        <h3>Contenu du .htaccess API:</h3>
        <pre>' . htmlspecialchars($htaccess_api_content) . '</pre>
    </div>
    
    <div class="section">
        <h2>Exécution de PHP</h2>
        <p><strong>Exécution de PHP:</strong> <span class="' . ($php_execution == 'OK' ? 'success' : 'error') . '">' . $php_execution . '</span></p>
        <p>Si ce message s\'affiche, PHP est correctement exécuté sur ce script.</p>
        <p>Essayez d\'accéder à <a href="../api/index.php">../api/index.php</a> pour tester l\'API principale.</p>
    </div>
    
    <div class="section">
        <h2>Recommandations</h2>
        <p>Si PHP n\'est pas exécuté correctement:</p>
        <ol>
            <li>Vérifiez que le module PHP est activé sur votre serveur</li>
            <li>Assurez-vous que les fichiers .htaccess sont correctement configurés et autorisés (AllowOverride All)</li>
            <li>Vérifiez que les chemins vers les interpréteurs PHP sont corrects</li>
            <li>Contactez votre hébergeur (Infomaniak) pour vérifier la configuration du serveur</li>
        </ol>
    </div>
</body>
</html>';
