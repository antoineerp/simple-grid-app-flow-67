
<?php
// Script pour vérifier les chemins d'accès et la structure des fichiers
echo "=== Vérification des chemins d'accès ===\n";
echo "Exécuté le: " . date('Y-m-d H:i:s') . "\n\n";

// Informations sur le serveur et l'environnement
echo "INFORMATIONS SERVEUR:\n";
echo "- PHP Version: " . phpversion() . "\n";
echo "- Système d'exploitation: " . PHP_OS . "\n";
echo "- Interface PHP: " . php_sapi_name() . "\n";
echo "- Répertoire courant: " . getcwd() . "\n";
echo "- Script: " . __FILE__ . "\n\n";

// Vérifier les chemins importants
echo "CHEMINS IMPORTANTS:\n";
$paths = [
    'Document Root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini',
    'Script Filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Non défini',
    'Script Name' => $_SERVER['SCRIPT_NAME'] ?? 'Non défini',
    'PHP_SELF' => $_SERVER['PHP_SELF'] ?? 'Non défini',
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'Non défini',
    'include_path' => get_include_path()
];

foreach ($paths as $name => $path) {
    echo "- $name: $path\n";
}

// Vérifier les dossiers importants
echo "\nSTRUCTURE DES DOSSIERS:\n";
$directories = [
    '.' => 'Répertoire courant',
    './api' => 'API',
    './api/config' => 'Configuration API',
    './api/controllers' => 'Contrôleurs API',
    './api/models' => 'Modèles API',
    './public' => 'Public'
];

foreach ($directories as $dir => $desc) {
    if (is_dir($dir)) {
        echo "✓ $dir: Existe ($desc)\n";
        
        // Lister quelques fichiers
        $files = scandir($dir);
        $files = array_diff($files, ['.', '..']);
        $fileList = array_slice($files, 0, 5);
        echo "  • Fichiers: " . implode(', ', $fileList) . (count($files) > 5 ? '...' : '') . "\n";
        
        // Vérifier les permissions
        $perms = substr(sprintf('%o', fileperms($dir)), -4);
        $owner = posix_getpwuid(fileowner($dir))['name'] ?? 'unknown';
        $group = posix_getgrgid(filegroup($dir))['name'] ?? 'unknown';
        echo "  • Permissions: $perms (propriétaire: $owner, groupe: $group)\n";
    } else {
        echo "✗ $dir: N'existe pas ($desc)\n";
    }
}

// Vérifier les fichiers importants
echo "\nFICHIERS CLÉS:\n";
$files = [
    './index.php' => 'Point d\'entrée',
    './phpinfo.php' => 'Information PHP',
    './php-debug.php' => 'Diagnostic PHP',
    './api/index.php' => 'Point d\'entrée API',
    './api/config/db_config.json' => 'Configuration BDD',
    './.htaccess' => 'Configuration Apache',
    './api/.htaccess' => 'Configuration Apache API'
];

foreach ($files as $file => $desc) {
    if (file_exists($file)) {
        $size = filesize($file);
        $perms = substr(sprintf('%o', fileperms($file)), -4);
        $owner = posix_getpwuid(fileowner($file))['name'] ?? 'unknown';
        $group = posix_getgrgid(filegroup($file))['name'] ?? 'unknown';
        echo "✓ $file: Existe ($desc, taille: $size octets)\n";
        echo "  • Permissions: $perms (propriétaire: $owner, groupe: $group)\n";
    } else {
        echo "✗ $file: N'existe pas ($desc)\n";
    }
}

// Vérifier les extensions PHP chargées
echo "\nEXTENSIONS PHP:\n";
$requiredExtensions = ['mysqli', 'pdo', 'pdo_mysql', 'json', 'curl', 'mbstring'];
foreach ($requiredExtensions as $ext) {
    echo "- $ext: " . (extension_loaded($ext) ? 'Chargée' : 'Non chargée') . "\n";
}

echo "\nVérification terminée.\n";
?>
