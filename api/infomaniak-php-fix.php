
<?php
// Script pour essayer de résoudre le problème d'exécution PHP sur Infomaniak
// ce fichier tente plusieurs méthodes de configuration

// Définir explicitement le type de contenu HTML
header("Content-Type: text/html; charset=UTF-8");

// Forcer l'affichage des erreurs pour le diagnostic
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Fonction pour vérifier si on peut écrire un fichier
function test_file_write($file, $content) {
    $result = @file_put_contents($file, $content);
    return $result !== false;
}

// Fonction pour créer un fichier de configuration
function create_config_file($file, $content) {
    $success = test_file_write($file, $content);
    return [
        'file' => $file,
        'success' => $success,
        'message' => $success ? 'Fichier créé avec succès' : 'Échec de création du fichier'
    ];
}

// Essayer de créer plusieurs fichiers de configuration
$configs = [];

// 1. Créer un .htaccess
$htaccess_content = "
AddHandler application/x-httpd-php .php
AddHandler fcgid-script .php
AddHandler php8-fcgi .php

<FilesMatch \"\\.php$\">
    SetHandler application/x-httpd-php
</FilesMatch>

Options +ExecCGI
";
$configs[] = create_config_file(__DIR__ . '/.htaccess-new', $htaccess_content);

// 2. Créer un .user.ini
$user_ini_content = "
engine = On
display_errors = On
error_reporting = E_ALL
";
$configs[] = create_config_file(__DIR__ . '/.user.ini-new', $user_ini_content);

// 3. Créer un php.ini
$php_ini_content = "
engine = On
display_errors = On
error_reporting = E_ALL
";
$configs[] = create_config_file(__DIR__ . '/php.ini-new', $php_ini_content);

// 4. Créer un test PHP simple
$test_php_content = "<?php
// Test PHP simple
echo 'PHP fonctionne! Heure actuelle: ' . date('Y-m-d H:i:s');
?>";
$configs[] = create_config_file(__DIR__ . '/php-works.php', $test_php_content);

?>
<!DOCTYPE html>
<html>
<head>
    <title>Réparation PHP Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Tentative de réparation de la configuration PHP</h1>
    
    <div>
        <h2>PHP fonctionne!</h2>
        <p>Si vous voyez cette page, cela signifie que PHP s'exécute correctement sur ce fichier particulier.</p>
        <p>Version PHP: <strong><?php echo phpversion(); ?></strong></p>
    </div>
    
    <div>
        <h2>Résultats des tentatives de configuration</h2>
        <ul>
            <?php foreach ($configs as $config): ?>
            <li class="<?php echo $config['success'] ? 'success' : 'error'; ?>">
                <?php echo $config['file']; ?>: <?php echo $config['message']; ?>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>
    
    <div>
        <h2>Étapes suivantes</h2>
        <ol>
            <li>Essayez d'accéder à <a href="php-works.php">php-works.php</a> pour vérifier si PHP s'exécute.</li>
            <li>Si cela fonctionne, essayez de renommer les fichiers créés:
                <ul>
                    <li>Renommez .htaccess-new en .htaccess</li>
                    <li>Renommez .user.ini-new en .user.ini</li>
                    <li>Renommez php.ini-new en php.ini</li>
                </ul>
            </li>
            <li>Si PHP ne s'exécute toujours pas, contactez le support d'Infomaniak et mentionnez que:
                <ul>
                    <li>Le code PHP est renvoyé au lieu d'être exécuté</li>
                    <li>Vous avez besoin que le module PHP soit correctement configuré pour votre hébergement</li>
                </ul>
            </li>
        </ol>
    </div>
</body>
</html>
