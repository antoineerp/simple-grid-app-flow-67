
<?php
header('Content-Type: text/html; charset=utf-8');

// Fonction pour vérifier et corriger les types MIME
function fix_mime_types() {
    $htaccess_content = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Configuration explicite des types MIME pour JavaScript
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# En-têtes de cache pour les assets
<FilesMatch "\.(js|mjs|css)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

# Forcer le type MIME pour JavaScript
<Files *.js>
    ForceType application/javascript
</Files>

<Files *.mjs>
    ForceType application/javascript
</Files>

# Autoriser l'accès aux fichiers
<Files *>
    Order Allow,Deny
    Allow from all
</Files>
EOT;

    // Écrire le fichier .htaccess dans différents emplacements
    $locations = [
        './',
        './assets/',
        './dist/assets/',
    ];

    foreach ($locations as $location) {
        if (is_dir($location)) {
            file_put_contents($location . '.htaccess', $htaccess_content);
        }
    }

    return true;
}

// Exécuter la correction
$fixed = fix_mime_types();

// Répondre avec un statut JSON
header('Content-Type: application/json');
echo json_encode([
    'success' => $fixed,
    'message' => $fixed ? 'Les types MIME ont été corrigés avec succès' : 'Échec de la correction des types MIME',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
