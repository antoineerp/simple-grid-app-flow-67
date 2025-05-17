
<?php
// Script à exécuter avant le déploiement pour résoudre les problèmes courants
header('Content-Type: text/html; charset=utf-8');

// Fonction pour créer un répertoire s'il n'existe pas
function ensure_directory_exists($path) {
    if (!file_exists($path)) {
        return mkdir($path, 0755, true);
    }
    return true;
}

// Répertoires à créer
$directories = [
    './api',
    './api/documentation',
    './api/config',
    './api/controllers',
    './api/models',
    './api/middleware',
    './api/operations',
    './api/utils',
    './assets',
    './public',
    './public/lovable-uploads',
    './api-tools'
];

$results = [];
foreach ($directories as $dir) {
    $results[$dir] = ensure_directory_exists($dir);
}

// Créer un README dans api/documentation pour éviter l'erreur FTP
$readme_path = './api/documentation/README.md';
if (!file_exists($readme_path)) {
    file_put_contents($readme_path, "# Documentation API\n\nCe dossier contient la documentation de l'API.");
}

// Créer un .htaccess pour l'API
$htaccess_path = './api/.htaccess';
if (!file_exists($htaccess_path)) {
    $htaccess_content = <<<EOT
# Activation du module de réécriture d'URL
RewriteEngine On

# Définir le répertoire de base
RewriteBase /api/

# Rediriger toutes les requêtes vers le fichier index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Définir les en-têtes CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
</IfModule>

# Définir le type MIME pour JSON
AddType application/json .json

# Désactiver la mise en cache pour les API
<IfModule mod_expires.c>
    ExpiresActive Off
</IfModule>
EOT;
    
    file_put_contents($htaccess_path, $htaccess_content);
}

// Créer un .htaccess principal s'il n'existe pas
$main_htaccess_path = './.htaccess';
if (!file_exists($main_htaccess_path)) {
    $main_htaccess_content = <<<EOT
# Activation du module de réécriture d'URL
RewriteEngine On

# Définir la page d'index par défaut
DirectoryIndex index.html index.php

# Rediriger toutes les requêtes vers index.html sauf pour les fichiers et répertoires existants
# et sauf pour le répertoire /api
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ index.html [QSA,L]

# Définir les types MIME
AddType application/javascript .js
AddType text/css .css

# Force les types MIME corrects
<FilesMatch "\.js$">
    ForceType application/javascript
</FilesMatch>

<FilesMatch "\.css$">
    ForceType text/css
</FilesMatch>

# Activer la compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>
EOT;
    
    file_put_contents($main_htaccess_path, $main_htaccess_content);
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Préparation au déploiement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; }
        .error { color: red; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Préparation au déploiement</h1>
    <p>Création des répertoires et fichiers nécessaires pour éviter les erreurs de déploiement.</p>
    
    <h2>Résultats</h2>
    <table>
        <tr>
            <th>Répertoire</th>
            <th>Statut</th>
        </tr>
        <?php foreach ($results as $dir => $success): ?>
        <tr>
            <td><?php echo htmlspecialchars($dir); ?></td>
            <td class="<?php echo $success ? 'success' : 'error'; ?>">
                <?php echo $success ? 'Créé/Existant' : 'Erreur'; ?>
            </td>
        </tr>
        <?php endforeach; ?>
    </table>
    
    <p>Les fichiers suivants ont été créés ou vérifiés:</p>
    <ul>
        <li>Fichier README.md dans api/documentation</li>
        <li>Fichier .htaccess dans le répertoire api</li>
        <li>Fichier .htaccess principal à la racine</li>
    </ul>
    
    <h2>Prochaine étape</h2>
    <p>Utilisez les outils suivants pour vérifier et corriger l'installation:</p>
    <ul>
        <li><a href="check-build-status.php">Vérifier l'état du build</a></li>
        <li><a href="fix-missing-files.php">Corriger les fichiers manquants</a></li>
        <li><a href="fix-index-assets-simplified.php">Réparer les références CSS/JS</a></li>
        <li><a href="check-route-duplication.php">Vérifier les routes</a></li>
    </ul>
    
    <p><a href="javascript:history.back()">Retour</a></p>
</body>
</html>
