
<?php
// Script pour identifier la source d'une erreur 500
header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNOSTIC ERREUR 500 ===\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Version: " . phpversion() . "\n\n";

// Vérification de la configuration du serveur
echo "=== CONFIGURATION SERVEUR ===\n";
echo "Server API: " . php_sapi_name() . "\n";
echo "Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Non défini') . "\n";
echo "Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Non défini') . "\n\n";

// Vérification des modules PHP chargés
echo "=== MODULES PHP CHARGÉS ===\n";
$modules = get_loaded_extensions();
sort($modules);
foreach ($modules as $module) {
    echo "- $module\n";
}

// Vérification des configurations PHP critiques
echo "\n=== CONFIGURATION PHP ===\n";
$important_settings = [
    'display_errors', 'error_reporting', 'log_errors', 
    'error_log', 'memory_limit', 'max_execution_time',
    'post_max_size', 'upload_max_filesize'
];

foreach ($important_settings as $setting) {
    echo "$setting: " . ini_get($setting) . "\n";
}

// Vérification des fichiers critiques
echo "\n=== FICHIERS CRITIQUES ===\n";
$critical_files = [
    '.htaccess', 'index.php', 'index.html', 
    'api/.htaccess', 'api/index.php'
];

foreach ($critical_files as $file) {
    echo "$file: ";
    if (file_exists($file)) {
        echo "EXISTE - Permissions: " . substr(sprintf('%o', fileperms($file)), -4);
        echo " - Taille: " . filesize($file) . " octets\n";
    } else {
        echo "MANQUANT\n";
    }
}

// Vérification des dossiers importants
echo "\n=== DOSSIERS IMPORTANTS ===\n";
$important_dirs = [
    '.', 'api', 'dist', 'dist/assets', 'lovable-uploads'
];

foreach ($important_dirs as $dir) {
    echo "$dir: ";
    if (is_dir($dir)) {
        echo "EXISTE - Permissions: " . substr(sprintf('%o', fileperms($dir)), -4);
        $files = scandir($dir);
        echo " - " . (count($files) - 2) . " fichiers\n"; // -2 pour . et ..
    } else {
        echo "MANQUANT\n";
    }
}

// Recommandations
echo "\n=== RECOMMANDATIONS ===\n";
echo "1. Vérifiez que PHP est correctement configuré sur votre hébergement\n";
echo "2. Assurez-vous que les permissions des fichiers sont correctes (644 pour les fichiers, 755 pour les dossiers)\n";
echo "3. Vérifiez que le module mod_rewrite est activé\n";
echo "4. Testez avec un fichier PHP minimal comme test-minimal.php\n";
echo "5. Consultez les logs d'erreur de votre hébergement\n";

echo "\nDiagnostic terminé. Si vous voyez ce message, PHP fonctionne au moins partiellement.";
?>
