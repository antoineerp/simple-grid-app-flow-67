
<?php
// Script de diagnostic et réparation spécifique pour Infomaniak
header('Content-Type: text/html; charset=utf-8');

// Fonction pour tester l'exécution PHP
function test_php_execution() {
    return [
        'success' => true,
        'php_version' => phpversion(),
        'sapi' => php_sapi_name(),
        'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
        'infomaniak_detected' => (strpos($_SERVER['SERVER_SOFTWARE'] ?? '', 'Infomaniak') !== false)
    ];
}

// Fonction pour tester .htaccess
function test_htaccess() {
    // Créer un fichier temporaire pour tester l'accès
    $test_dir = '.htaccess-test';
    $test_file = $test_dir . '/test.txt';
    $htaccess_file = $test_dir . '/.htaccess';
    
    if (!is_dir($test_dir)) {
        mkdir($test_dir, 0755);
    }
    
    // Créer un fichier de test
    file_put_contents($test_file, 'Test file');
    
    // Créer un .htaccess qui bloque l'accès
    file_put_contents($htaccess_file, "Deny from all\n");
    
    // Vérifier si on peut accéder au fichier
    $url = 'https://' . $_SERVER['HTTP_HOST'] . '/' . $test_file;
    $blocked = false;
    
    // Nettoyer après le test
    @unlink($test_file);
    @unlink($htaccess_file);
    @rmdir($test_dir);
    
    return [
        'success' => true,
        'htaccess_works' => $blocked
    ];
}

// Fonction pour corriger .htaccess pour Infomaniak
function fix_htaccess_for_infomaniak() {
    $htaccess_content = <<<EOT
# Configuration spécifique pour Infomaniak
AddHandler php-fcgi .php
Action php-fcgi /dispatcher.fcgi
<Files dispatcher.fcgi>
    Order allow,deny
    Allow from all
</Files>

# Forcer l'utilisation du charset UTF-8
AddDefaultCharset UTF-8

# Activer le moteur de réécriture
RewriteEngine On

# Ne pas rediriger les API appels
RewriteRule ^api/ - [L]

# Ne pas rediriger les fichiers existants
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Rediriger vers index.html pour toutes les autres requêtes
RewriteRule ^ index.html [L]
EOT;

    // Sauvegarder l'ancien .htaccess
    if (file_exists('.htaccess')) {
        copy('.htaccess', '.htaccess.bak.' . time());
    }
    
    // Écrire le nouveau .htaccess
    $success = file_put_contents('.htaccess', $htaccess_content) !== false;
    
    return [
        'success' => $success,
        'backup_created' => file_exists('.htaccess.bak.' . time())
    ];
}

// Fonction pour corriger .user.ini pour Infomaniak
function fix_user_ini_for_infomaniak() {
    $user_ini_content = <<<EOT
; Configuration PHP spécifique pour Infomaniak
display_errors = Off
log_errors = On
error_log = /tmp/php_errors.log
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
max_execution_time = 120
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
default_charset = "UTF-8"
EOT;

    // Sauvegarder l'ancien .user.ini
    if (file_exists('.user.ini')) {
        copy('.user.ini', '.user.ini.bak.' . time());
    }
    
    // Écrire le nouveau .user.ini
    $success = file_put_contents('.user.ini', $user_ini_content) !== false;
    
    // Créer user.ini dans api/ également
    if (!is_dir('api')) {
        mkdir('api', 0755);
    }
    
    $api_success = true;
    if (is_dir('api')) {
        $api_success = file_put_contents('api/.user.ini', $user_ini_content) !== false;
    }
    
    return [
        'success' => $success && $api_success,
        'root_updated' => $success,
        'api_updated' => $api_success
    ];
}

// Fonction pour créer le fichier de test PHP
function create_test_php() {
    $test_php_content = <<<EOT
<?php
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'PHP est correctement exécuté',
    'php_version' => phpversion(),
    'time' => date('c'),
    'server_software' => \$_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu'
]);
?>
EOT;

    $success = file_put_contents('api/test.php', $test_php_content) !== false;
    
    return [
        'success' => $success,
        'file_path' => 'api/test.php'
    ];
}

// Fonction pour créer un vhost.conf spécifique à Infomaniak
function create_vhost_conf() {
    $vhost_content = <<<EOT
<Directory "/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch">
    Options +Indexes +FollowSymLinks +ExecCGI
    AllowOverride All
    Require all granted
    AddHandler php-fcgi .php
    Action php-fcgi /dispatcher.fcgi
</Directory>
EOT;

    $success = file_put_contents('vhost.conf', $vhost_content) !== false;
    
    return [
        'success' => $success,
        'file_path' => 'vhost.conf',
        'note' => 'Ce fichier doit être placé dans le répertoire "conf/" de votre hébergement Infomaniak'
    ];
}

// Fonction pour créer dispatcher.fcgi pour Infomaniak
function create_dispatcher_fcgi() {
    $dispatcher_content = <<<EOT
#!/bin/bash
exec /usr/local/php8.1/bin/php-cgi
EOT;

    $success = file_put_contents('dispatcher.fcgi', $dispatcher_content) !== false;
    if ($success) {
        chmod('dispatcher.fcgi', 0755);
    }
    
    return [
        'success' => $success && is_executable('dispatcher.fcgi'),
        'file_path' => 'dispatcher.fcgi',
        'is_executable' => is_executable('dispatcher.fcgi')
    ];
}

// Exécuter les tests et corrections
$results = [
    'timestamp' => date('c'),
    'php_test' => test_php_execution(),
    'fixes_applied' => [
        'htaccess' => fix_htaccess_for_infomaniak(),
        'user_ini' => fix_user_ini_for_infomaniak(),
        'test_php' => create_test_php(),
        'vhost_conf' => create_vhost_conf(),
        'dispatcher_fcgi' => create_dispatcher_fcgi()
    ],
    'next_steps' => [
        'Contactez le support Infomaniak avec ces résultats',
        'Demandez si le mode PHP-FPM est correctement activé',
        'Vérifiez que le vhost.conf est correctement configuré',
        'Testez l\'URL: ' . 'https://' . ($_SERVER['HTTP_HOST'] ?? 'qualiopi.ch') . '/api/test.php'
    ]
];

// Afficher les résultats
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnostic PHP Infomaniak</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #333; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        .success { color: green; }
        .error { color: red; }
        .code { background: #f5f5f5; padding: 12px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; }
        .steps { background: #fffaf0; padding: 16px; border-left: 4px solid #f0ad4e; }
    </style>
</head>
<body>
    <h1>Diagnostic PHP pour Infomaniak</h1>
    
    <div class="card">
        <h2>Test PHP</h2>
        <?php if ($results['php_test']['success']): ?>
            <p class="success">✓ PHP s'exécute correctement</p>
            <p>Version PHP: <?= htmlspecialchars($results['php_test']['php_version']) ?></p>
            <p>SAPI: <?= htmlspecialchars($results['php_test']['sapi']) ?></p>
            <p>Serveur: <?= htmlspecialchars($results['php_test']['server']) ?></p>
        <?php else: ?>
            <p class="error">✗ Problème d'exécution PHP</p>
        <?php endif; ?>
    </div>
    
    <div class="card">
        <h2>Corrections appliquées</h2>
        <h3>Fichier .htaccess</h3>
        <?php if ($results['fixes_applied']['htaccess']['success']): ?>
            <p class="success">✓ .htaccess mis à jour avec succès</p>
            <p>Une sauvegarde a été créée: <?= $results['fixes_applied']['htaccess']['backup_created'] ? 'Oui' : 'Non' ?></p>
        <?php else: ?>
            <p class="error">✗ Problème lors de la mise à jour du .htaccess</p>
        <?php endif; ?>
        
        <h3>Fichier .user.ini</h3>
        <?php if ($results['fixes_applied']['user_ini']['success']): ?>
            <p class="success">✓ .user.ini mis à jour avec succès</p>
            <p>Racine mise à jour: <?= $results['fixes_applied']['user_ini']['root_updated'] ? 'Oui' : 'Non' ?></p>
            <p>Dossier API mis à jour: <?= $results['fixes_applied']['user_ini']['api_updated'] ? 'Oui' : 'Non' ?></p>
        <?php else: ?>
            <p class="error">✗ Problème lors de la mise à jour du .user.ini</p>
        <?php endif; ?>
        
        <h3>Fichier de test PHP</h3>
        <?php if ($results['fixes_applied']['test_php']['success']): ?>
            <p class="success">✓ Fichier de test PHP créé</p>
            <p>Chemin: <?= htmlspecialchars($results['fixes_applied']['test_php']['file_path']) ?></p>
        <?php else: ?>
            <p class="error">✗ Problème lors de la création du fichier test PHP</p>
        <?php endif; ?>
        
        <h3>Configuration vhost.conf</h3>
        <?php if ($results['fixes_applied']['vhost_conf']['success']): ?>
            <p class="success">✓ Fichier vhost.conf créé</p>
            <p>Note: <?= htmlspecialchars($results['fixes_applied']['vhost_conf']['note']) ?></p>
        <?php else: ?>
            <p class="error">✗ Problème lors de la création du vhost.conf</p>
        <?php endif; ?>
        
        <h3>Dispatcher FastCGI</h3>
        <?php if ($results['fixes_applied']['dispatcher_fcgi']['success']): ?>
            <p class="success">✓ Fichier dispatcher.fcgi créé</p>
            <p>Exécutable: <?= $results['fixes_applied']['dispatcher_fcgi']['is_executable'] ? 'Oui' : 'Non' ?></p>
        <?php else: ?>
            <p class="error">✗ Problème lors de la création du dispatcher.fcgi</p>
        <?php endif; ?>
    </div>
    
    <div class="card steps">
        <h2>Prochaines étapes</h2>
        <ol>
            <?php foreach ($results['next_steps'] as $step): ?>
                <li><?= htmlspecialchars($step) ?></li>
            <?php endforeach; ?>
        </ol>
    </div>
    
    <div class="card">
        <h2>Informations pour le support Infomaniak</h2>
        <div class="code">
<?php
$server_info = [
    'PHP_VERSION' => PHP_VERSION,
    'SERVER_SOFTWARE' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non défini',
    'DOCUMENT_ROOT' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini',
    'SCRIPT_FILENAME' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini',
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'] ?? 'Non défini',
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'Non défini',
    'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? 'Non défini',
    'REMOTE_ADDR' => $_SERVER['REMOTE_ADDR'] ?? 'Non défini'
];

foreach ($server_info as $key => $value) {
    echo htmlspecialchars("$key: $value") . "\n";
}
?>
        </div>
    </div>
</body>
</html>
