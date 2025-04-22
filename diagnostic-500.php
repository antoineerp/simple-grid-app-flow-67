
<?php
// Définir le type de contenu en texte simple pour éviter tout problème d'interprétation
header('Content-Type: text/plain; charset=utf-8');

// Informations de base
echo "=== DIAGNOSTIC ERREUR 500 ===\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Non défini') . "\n";
echo "Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Non défini') . "\n\n";

// Vérification des fichiers critiques
$critical_files = [
    '.htaccess',
    'index.php',
    'index.html',
    'php.ini',
    '.user.ini',
    'api/.htaccess',
    'api/index.php'
];

echo "=== VÉRIFICATION DES FICHIERS CRITIQUES ===\n";
foreach ($critical_files as $file) {
    echo "$file: ";
    if (file_exists($file)) {
        echo "EXISTE";
        $perms = substr(sprintf('%o', fileperms($file)), -4);
        echo " (permissions: $perms)";
        echo " - Taille: " . filesize($file) . " octets";
        echo "\n";
    } else {
        echo "INTROUVABLE\n";
    }
}

// Vérification des dossiers importants
echo "\n=== VÉRIFICATION DES DOSSIERS ===\n";
$dirs = ['.', './api', './dist', './dist/assets'];
foreach ($dirs as $dir) {
    echo "$dir: ";
    if (is_dir($dir)) {
        echo "EXISTE";
        $perms = substr(sprintf('%o', fileperms($dir)), -4);
        echo " (permissions: $perms)";
        echo " - " . count(scandir($dir)) . " fichiers";
        echo "\n";
    } else {
        echo "INTROUVABLE\n";
    }
}

// Vérification de la configuration PHP
echo "\n=== CONFIGURATION PHP ===\n";
echo "display_errors: " . ini_get('display_errors') . "\n";
echo "error_reporting: " . ini_get('error_reporting') . "\n";
echo "log_errors: " . ini_get('log_errors') . "\n";
echo "error_log: " . ini_get('error_log') . "\n";
echo "memory_limit: " . ini_get('memory_limit') . "\n";
echo "max_execution_time: " . ini_get('max_execution_time') . "\n";

// Vérification des logs d'erreur si accessibles
echo "\n=== DERNIÈRES ERREURS (si accessibles) ===\n";
$error_log = ini_get('error_log');
if ($error_log && file_exists($error_log) && is_readable($error_log)) {
    echo "Contenu des 10 dernières lignes du log:\n";
    echo implode("\n", array_slice(file($error_log), -10));
} else {
    echo "Log d'erreurs non accessible\n";
}

// Vérification spécifique à Infomaniak
echo "\n=== SPÉCIFIQUE INFOMANIAK ===\n";
echo "Handler PHP: " . php_sapi_name() . "\n";
echo "Modules chargés: " . implode(", ", get_loaded_extensions()) . "\n";
?>
