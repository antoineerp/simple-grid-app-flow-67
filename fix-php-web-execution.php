<?php
// Script pour diagnostiquer et corriger les problèmes d'exécution PHP via le web
// Uniquement pour SSH - exécutez avec: php fix-php-web-execution.php

header("Content-Type: text/plain");
echo "=== DIAGNOSTIC ET CORRECTION DU PROBLÈME D'EXÉCUTION PHP ===\n";

// Vérifier si nous sommes en mode CLI
if (php_sapi_name() !== 'cli') {
    echo "Ce script doit être exécuté en mode CLI (via SSH).\n";
    exit(1);
}

// Fonctions de correction
function create_htaccess() {
    $htaccess_content = <<<'EOT'
# Activer le moteur de réécriture
RewriteEngine On

# Force l'interprétation des fichiers .php par le moteur PHP
AddType application/x-httpd-php .php
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Configuration des types MIME pour CSS et JavaScript
AddType text/css .css
AddType application/javascript .js

# Rediriger toutes les requêtes vers index.html sauf les fichiers physiques, dossiers ou API
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/)(.*)$ /index.html [L]

# Désactiver l'indexation des répertoires
Options -Indexes

# Protection des fichiers sensibles
<FilesMatch "^(\.htaccess|\.user\.ini|db_config\.json)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
EOT;

    return file_put_contents('.htaccess', $htaccess_content);
}

function create_user_ini() {
    $user_ini_content = <<<'EOT'
; Configuration PHP pour Infomaniak
display_errors = On
log_errors = On
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
max_execution_time = 120
memory_limit = 256M
upload_max_filesize = 64M
post_max_size = 64M
default_charset = "UTF-8"
EOT;

    return file_put_contents('.user.ini', $user_ini_content);
}

function create_api_htaccess() {
    $api_htaccess_content = <<<'EOT'
# Configuration pour le dossier API
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Activer la réécriture d'URL
RewriteEngine On

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Configuration CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Éviter la mise en cache des réponses API
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>
EOT;

    // Créer le dossier api s'il n'existe pas
    if (!is_dir('api')) {
        mkdir('api', 0755);
    }

    return file_put_contents('api/.htaccess', $api_htaccess_content);
}

function create_php_test() {
    $test_content = <<<'EOT'
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test PHP pour le web</title>
</head>
<body>
    <h1>Test d'exécution PHP via le web</h1>
    <p>Si vous voyez ce message, votre serveur exécute correctement PHP.</p>
    <p>Date et heure: <?php echo date('Y-m-d H:i:s'); ?></p>
    <p>Version PHP: <?php echo phpversion(); ?></p>
</body>
</html>
EOT;

    return file_put_contents('web-php-test.php', $test_content);
}

echo "Vérification des fichiers de configuration...\n\n";

// 1. Vérifier et corriger .htaccess
if (!file_exists('.htaccess') || filesize('.htaccess') < 100) {
    echo "Création du fichier .htaccess...\n";
    if (create_htaccess()) {
        echo "✓ Fichier .htaccess créé avec succès.\n";
    } else {
        echo "✗ Impossible de créer le fichier .htaccess.\n";
    }
} else {
    echo "Le fichier .htaccess existe déjà.\n";
}

// 2. Vérifier et corriger .user.ini
if (!file_exists('.user.ini')) {
    echo "Création du fichier .user.ini...\n";
    if (create_user_ini()) {
        echo "✓ Fichier .user.ini créé avec succès.\n";
    } else {
        echo "✗ Impossible de créer le fichier .user.ini.\n";
    }
} else {
    echo "Le fichier .user.ini existe déjà.\n";
}

// 3. Vérifier et créer l'htaccess pour API
if (!file_exists('api/.htaccess')) {
    echo "Création du fichier api/.htaccess...\n";
    if (create_api_htaccess()) {
        echo "✓ Fichier api/.htaccess créé avec succès.\n";
    } else {
        echo "✗ Impossible de créer le fichier api/.htaccess.\n";
    }
} else {
    echo "Le fichier api/.htaccess existe déjà.\n";
}

// 4. Créer un test PHP
echo "Création d'un fichier de test PHP...\n";
if (create_php_test()) {
    echo "✓ Fichier web-php-test.php créé avec succès.\n";
} else {
    echo "✗ Impossible de créer le fichier web-php-test.php.\n";
}

echo "\nPermissions de fichiers:\n";
$files_to_check = ['.htaccess', '.user.ini', 'api/.htaccess', 'web-php-test.php'];
foreach ($files_to_check as $file) {
    if (file_exists($file)) {
        $perms = substr(sprintf('%o', fileperms($file)), -4);
        echo "$file: $perms\n";
        
        // Corriger les permissions si nécessaire
        if ($perms !== "0644") {
            echo "  Correction des permissions à 644...\n";
            chmod($file, 0644);
            $new_perms = substr(sprintf('%o', fileperms($file)), -4);
            echo "  Nouvelles permissions: $new_perms\n";
        }
    }
}

echo "\nConseils pour résoudre le problème de téléchargement des fichiers PHP:\n";
echo "1. Vérifiez que PHP est activé dans votre hébergement Infomaniak\n";
echo "2. Contactez le support Infomaniak pour vérifier la configuration du gestionnaire PHP\n";
echo "3. Demandez-leur de vérifier que le handler PHP est correctement configuré pour les fichiers .php\n";

echo "\nInstructions pour tester la connexion à la base de données via SSH:\n";
echo "Exécutez: php ssh-db-test.php\n";
echo "\nN'oubliez pas de définir les bonnes permissions (644) sur vos fichiers PHP.\n";
?>
