
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour vérifier et corriger .htaccess
function checkAndFixHtaccess() {
    $htaccess_path = './.htaccess';
    $results = [
        'existing' => file_exists($htaccess_path),
        'readable' => is_readable($htaccess_path),
        'writable' => is_writable($htaccess_path),
        'content' => '',
        'changes' => [],
        'php_rule_added' => false
    ];
    
    // Lire le contenu existant
    if ($results['existing'] && $results['readable']) {
        $results['content'] = file_get_contents($htaccess_path);
    }
    
    // Vérifier si la règle PHP est déjà présente
    $php_rule_exists = strpos($results['content'], 'application/x-httpd-php') !== false;
    
    if (!$php_rule_exists) {
        // Ajouter la règle PHP si elle n'existe pas
        $new_content = $results['content'];
        $php_rule = "\n# Assurer que PHP est correctement interprété\n<FilesMatch \"\\.php$\">\n    SetHandler application/x-httpd-php\n</FilesMatch>\n";
        
        $new_content .= $php_rule;
        
        // Tenter d'écrire le fichier
        if ($results['writable']) {
            // Sauvegarde
            if ($results['existing']) {
                copy($htaccess_path, $htaccess_path . '.bak');
            }
            
            if (file_put_contents($htaccess_path, $new_content)) {
                $results['changes'][] = 'Règle PHP ajoutée à .htaccess';
                $results['php_rule_added'] = true;
            } else {
                $results['changes'][] = 'Échec de l\'écriture dans .htaccess';
            }
        } else {
            $results['changes'][] = '.htaccess n\'est pas modifiable';
        }
    } else {
        $results['changes'][] = 'La règle PHP existe déjà dans .htaccess';
    }
    
    return $results;
}

// Fonction pour créer un .htaccess simple si nécessaire
function createBasicHtaccess() {
    $htaccess_path = './.htaccess';
    
    if (file_exists($htaccess_path)) {
        return ['success' => false, 'message' => 'Le fichier .htaccess existe déjà'];
    }
    
    $basic_htaccess = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Configuration de base
Options -MultiViews
Options +FollowSymLinks

# Définir le point d'entrée principal
DirectoryIndex index.html index.php

# Définir les types MIME sans les forcer
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# Assurer que PHP est correctement interprété
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Permettre l'accès direct aux ressources statiques
RewriteCond %{REQUEST_URI} \.(js|mjs|css|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|map|tsx?|json|php)$
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Rediriger les autres requêtes vers index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ index.html [QSA,L]

# Configuration CORS simplifiée
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>

# Gestion des erreurs personnalisée
ErrorDocument 404 /index.html
EOT;

    if (file_put_contents($htaccess_path, $basic_htaccess)) {
        return ['success' => true, 'message' => 'Fichier .htaccess créé avec succès'];
    } else {
        return ['success' => false, 'message' => 'Impossible de créer le fichier .htaccess'];
    }
}

// Exécuter les actions
$fix_results = checkAndFixHtaccess();
$create_results = null;

if (!$fix_results['existing']) {
    $create_results = createBasicHtaccess();
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Correction de la Configuration PHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
        pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .code { font-family: monospace; background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Correction de la Configuration PHP</h1>
    
    <div class="section">
        <h2>Vérification du fichier .htaccess</h2>
        <p>État du fichier:</p>
        <ul>
            <li>Existe: <span class="<?php echo $fix_results['existing'] ? 'success' : 'error'; ?>"><?php echo $fix_results['existing'] ? 'Oui' : 'Non'; ?></span></li>
            <?php if ($fix_results['existing']): ?>
                <li>Lisible: <span class="<?php echo $fix_results['readable'] ? 'success' : 'error'; ?>"><?php echo $fix_results['readable'] ? 'Oui' : 'Non'; ?></span></li>
                <li>Modifiable: <span class="<?php echo $fix_results['writable'] ? 'success' : 'error'; ?>"><?php echo $fix_results['writable'] ? 'Oui' : 'Non'; ?></span></li>
            <?php endif; ?>
        </ul>
        
        <h3>Modifications:</h3>
        <ul>
            <?php foreach ($fix_results['changes'] as $change): ?>
                <li><?php echo htmlspecialchars($change); ?></li>
            <?php endforeach; ?>
        </ul>
        
        <?php if ($create_results): ?>
            <h3>Création d'un nouveau fichier .htaccess:</h3>
            <p class="<?php echo $create_results['success'] ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($create_results['message']); ?>
            </p>
        <?php endif; ?>
    </div>
    
    <div class="section">
        <h2>Vérification des scripts PHP</h2>
        <p>Test d'exécution PHP:</p>
        <pre><?php echo 'PHP version ' . phpversion() . ' fonctionne correctement.'; ?></pre>
        
        <h3>Configuration PHP:</h3>
        <ul>
            <li>Handler: <?php echo php_sapi_name(); ?></li>
            <li>display_errors: <?php echo ini_get('display_errors'); ?></li>
            <li>error_reporting: <?php echo ini_get('error_reporting'); ?></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Que faire maintenant?</h2>
        <p>Pour résoudre les problèmes d'accès aux fichiers PHP:</p>
        <ol>
            <li>Vérifiez que votre serveur a bien rechargé la configuration (vous devrez peut-être redémarrer le serveur web)</li>
            <li>Essayez d'accéder à nouveau au fichier <a href="diagnose-assets.php">diagnose-assets.php</a></li>
            <li>Si le problème persiste, essayez d'accéder au fichier dans le dossier API: <a href="api/diagnose-assets.php">api/diagnose-assets.php</a></li>
            <li>Exécutez le diagnostic PHP complet: <a href="php-test.php">php-test.php</a></li>
        </ol>
    </div>
    
    <p><a href="/">Retour à l'application</a></p>
</body>
</html>
