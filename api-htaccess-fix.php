
<?php
header('Content-Type: text/html; charset=utf-8');

// Définir le chemin du fichier .htaccess de l'API
$api_dir = 'api';
$htaccess_file = $api_dir . '/.htaccess';
$backup_file = $api_dir . '/.htaccess.backup.' . time();

// Vérifier si le dossier API existe
if (!is_dir($api_dir)) {
    echo "<p>Erreur: Le dossier API n'existe pas. Création du dossier...</p>";
    if (mkdir($api_dir, 0755, true)) {
        echo "<p>Le dossier API a été créé avec succès.</p>";
    } else {
        echo "<p>Impossible de créer le dossier API. Vérifiez les permissions.</p>";
        exit;
    }
}

// Sauvegarder le fichier existant si nécessaire
if (file_exists($htaccess_file)) {
    echo "<p>Fichier .htaccess existant trouvé. Création d'une sauvegarde...</p>";
    if (copy($htaccess_file, $backup_file)) {
        echo "<p>Sauvegarde créée: $backup_file</p>";
    } else {
        echo "<p>Impossible de créer une sauvegarde. Vérifiez les permissions.</p>";
    }
    
    // Afficher le contenu actuel
    echo "<h3>Contenu actuel du fichier .htaccess:</h3>";
    echo "<pre>" . htmlspecialchars(file_get_contents($htaccess_file)) . "</pre>";
}

// Contenu correct pour le fichier .htaccess de l'API
$htaccess_content = '# Configuration pour le dossier API sur Infomaniak

# Configuration PHP correcte (sans conflits)
AddHandler application/x-httpd-php .php
AddType application/x-httpd-php .php
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Activer la réécriture d\'URL
RewriteEngine On

# Définir les types MIME corrects
AddType application/javascript .js
AddType application/json .json
AddType text/css .css

# Gérer les requêtes OPTIONS pour CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Configuration CORS et types MIME
<IfModule mod_headers.c>
    # Force le bon type MIME pour les JavaScript
    <FilesMatch "\.js$">
        Header set Content-Type "application/javascript"
        Header set X-Content-Type-Options "nosniff"
    </FilesMatch>
    
    # Configuration CORS standardisée
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Device-ID"
    Header always set Access-Control-Max-Age "3600"
    
    # Éviter la mise en cache des réponses API
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
</IfModule>

# Permettre l\'accès direct aux fichiers PHP spécifiques
<FilesMatch "^(phpinfo|db-test|check|phpinfo-test|diagnostic|testdb|test|cors-diagnostic)\.php$">
    # Aucune réécriture pour ces fichiers
</FilesMatch>

# Rediriger toutes les requêtes vers l\'index.php sauf pour les fichiers existants
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
';

// Écrire le nouveau contenu dans le fichier .htaccess
if (file_put_contents($htaccess_file, $htaccess_content)) {
    echo "<p style='color: green; font-weight: bold;'>Le fichier .htaccess de l'API a été créé/mis à jour avec succès!</p>";
    
    // Définir les permissions correctes
    chmod($htaccess_file, 0644);
    echo "<p>Les permissions ont été définies à 644.</p>";
} else {
    echo "<p style='color: red; font-weight: bold;'>Impossible de créer/mettre à jour le fichier .htaccess de l'API. Vérifiez les permissions.</p>";
}

// Vérifier le workflow GitHub
echo "<h2>Vérification du fichier de workflow GitHub</h2>";
$workflow_file = '.github/workflows/deploy.yml';

if (file_exists($workflow_file)) {
    echo "<p>Le fichier de workflow GitHub existe: $workflow_file</p>";
    
    // Vérifier si le workflow contient la copie de .htaccess
    $workflow_content = file_get_contents($workflow_file);
    if (strpos($workflow_content, 'api/.htaccess') !== false) {
        echo "<p>Le workflow GitHub semble inclure la copie du fichier .htaccess de l'API.</p>";
    } else {
        echo "<p style='color: orange;'>Attention: Le workflow GitHub pourrait ne pas copier correctement le fichier .htaccess de l'API.</p>";
        echo "<p>Vérifiez votre fichier de workflow pour vous assurer qu'il copie correctement tous les fichiers nécessaires.</p>";
    }
} else {
    echo "<p>Le fichier de workflow GitHub n'a pas été trouvé: $workflow_file</p>";
}

// Fournir un lien vers la vérification du fichier
echo "<h2>Actions recommandées</h2>";
echo "<ul>";
echo "<li>Vérifiez que le fichier .htaccess a été correctement créé: <a href='api/.htaccess' target='_blank'>Voir le fichier .htaccess</a></li>";
echo "<li>Testez l'API: <a href='api/test.php' target='_blank'>Exécuter test.php</a></li>";
echo "<li>Vérifiez les informations PHP: <a href='api/phpinfo.php' target='_blank'>Voir phpinfo.php</a></li>";
echo "<li><a href='check-github-workflow.php'>Vérifier la configuration du workflow GitHub</a></li>";
echo "<li><a href='fix-workflow-yaml.php'>Réparer le fichier YAML du workflow</a></li>";
echo "</ul>";
?>

<!DOCTYPE html>
<html>
<head>
    <title>Correction du fichier .htaccess de l'API</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        h1, h2, h3 { color: #333; }
        p { line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Correction du fichier .htaccess de l'API</h1>
    <!-- Le contenu PHP sera inséré ici -->
</body>
</html>
