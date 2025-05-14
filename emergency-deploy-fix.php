
<?php
header('Content-Type: text/plain');
echo "=== Script de réparation d'urgence pour le déploiement ===\n";
echo "Exécution: " . date('Y-m-d H:i:s') . "\n\n";

// Créer et vérifier .htaccess de l'API (critique)
echo "Vérification du fichier api/.htaccess...\n";
$api_htaccess = './api/.htaccess';
$htaccess_content = '# Activer la réécriture d\'URL
RewriteEngine On

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/javascript .mjs
AddType application/javascript .es.js
AddType text/css .css
AddType application/json .json

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Configuration CORS et types MIME
<IfModule mod_headers.c>
    # Force le bon type MIME pour les JavaScript modules
    <FilesMatch "\.(m?js|es\.js)$">
        Header set Content-Type "application/javascript"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    
    # Eviter la mise en cache
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>

# Permettre l\'accès direct aux fichiers PHP spécifiques
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule \.(php)$ - [L]

# Rediriger toutes les requêtes vers l\'index.php sauf pour les fichiers existants
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]';

if (!file_exists('./api')) {
    mkdir('./api', 0755, true);
    echo "Dossier api/ créé\n";
}

if (file_exists($api_htaccess)) {
    $backup_path = $api_htaccess . '.bak.' . time();
    copy($api_htaccess, $backup_path);
    echo "Sauvegarde du fichier .htaccess existant vers $backup_path\n";
}

if (file_put_contents($api_htaccess, $htaccess_content)) {
    echo "✅ Fichier api/.htaccess créé/mis à jour avec succès\n";
    chmod($api_htaccess, 0644);
} else {
    echo "❌ ERREUR: Impossible de créer le fichier api/.htaccess\n";
}

// Créer et vérifier env.php
echo "\nVérification du fichier api/config/env.php...\n";
$config_dir = './api/config';
$env_php = "$config_dir/env.php";
$env_content = '<?php
// Configuration des variables d\'environnement pour Infomaniak
define("DB_HOST", "p71x6d.myd.infomaniak.com");
define("DB_NAME", "p71x6d_richard");
define("DB_USER", "p71x6d_richard");
define("DB_PASS", "Trottinette43!");
define("API_BASE_URL", "/api");
define("APP_ENV", "production");

// Fonction d\'aide pour récupérer les variables d\'environnement
function get_env($key, $default = null) {
    $const_name = strtoupper($key);
    if (defined($const_name)) {
        return constant($const_name);
    }
    return $default;
}';

if (!file_exists($config_dir)) {
    mkdir($config_dir, 0755, true);
    echo "Dossier $config_dir créé\n";
}

if (file_exists($env_php)) {
    $backup_path = $env_php . '.bak.' . time();
    copy($env_php, $backup_path);
    echo "Sauvegarde du fichier env.php existant vers $backup_path\n";
}

if (file_put_contents($env_php, $env_content)) {
    echo "✅ Fichier api/config/env.php créé/mis à jour avec succès\n";
    chmod($env_php, 0644);
} else {
    echo "❌ ERREUR: Impossible de créer le fichier api/config/env.php\n";
}

// Créer et vérifier db_config.json
echo "\nVérification du fichier api/config/db_config.json...\n";
$db_config = "$config_dir/db_config.json";
$db_config_content = '{
    "host": "p71x6d.myd.infomaniak.com",
    "db_name": "p71x6d_richard",
    "username": "p71x6d_richard",
    "password": "Trottinette43!"
}';

if (file_exists($db_config)) {
    $backup_path = $db_config . '.bak.' . time();
    copy($db_config, $backup_path);
    echo "Sauvegarde du fichier db_config.json existant vers $backup_path\n";
}

if (file_put_contents($db_config, $db_config_content)) {
    echo "✅ Fichier api/config/db_config.json créé/mis à jour avec succès\n";
    chmod($db_config, 0644);
} else {
    echo "❌ ERREUR: Impossible de créer le fichier api/config/db_config.json\n";
}

// Vérifier index.php à la racine
echo "\nVérification du fichier index.php à la racine...\n";
$index_php = './index.php';
$index_content = '<?php
// Redirection vers index.html
header(\'Location: index.html\');
exit;
?>';

if (!file_exists($index_php) || filesize($index_php) < 10) {
    if (file_put_contents($index_php, $index_content)) {
        echo "✅ Fichier index.php créé/mis à jour avec succès\n";
        chmod($index_php, 0644);
    } else {
        echo "❌ ERREUR: Impossible de créer le fichier index.php\n";
    }
} else {
    echo "Le fichier index.php existe déjà et semble correct\n";
}

// Vérifier les permissions
echo "\nApplication des permissions correctes...\n";
$directories = ['./api', './api/config', './assets', './public'];
foreach ($directories as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
        echo "Dossier $dir créé\n";
    }
    chmod($dir, 0755);
    echo "Permissions 755 appliquées à $dir\n";
}

// Récapitulatif
echo "\n=== RÉCAPITULATIF ===\n";
$critical_files = [
    './api/.htaccess',
    './api/config/env.php',
    './api/config/db_config.json',
    './index.php'
];

foreach ($critical_files as $file) {
    if (file_exists($file)) {
        echo "✅ $file: PRÉSENT (" . filesize($file) . " octets)\n";
    } else {
        echo "❌ $file: MANQUANT\n";
    }
}

echo "\nScript terminé le " . date('Y-m-d H:i:s') . "\n";
