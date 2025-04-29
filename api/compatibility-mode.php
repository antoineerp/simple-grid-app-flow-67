
<?php
// Fichier de compatibilité pour tester l'exécution PHP de manière minimale
// N'utilise aucune fonction avancée pour maximiser la compatibilité

// Désactiver tous les messages d'erreur pour ce test
error_reporting(0);

// En-têtes simples
header("Content-Type: text/html; charset=UTF-8");
header("X-PHP-Test: Minimal");

// Variables pour stocker les résultats
$is_working = true;
$php_version = PHP_VERSION;
$server_software = $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu';
$hostname = $_SERVER['HTTP_HOST'] ?? 'Inconnu';
$script_name = $_SERVER['SCRIPT_NAME'] ?? 'Inconnu';
$document_root = $_SERVER['DOCUMENT_ROOT'] ?? 'Inconnu';
$current_file = __FILE__;

// Tester la création de fichiers
$test_file = '../api-works.txt';
$can_write = @file_put_contents($test_file, "PHP fonctionne - " . date('Y-m-d H:i:s')) !== false;
$file_exists = file_exists($test_file);

// Générer une simple sortie HTML
echo "<!DOCTYPE html>\n";
echo "<html>\n<head>\n";
echo "<title>Test PHP Minimal</title>\n";
echo "<style>body{font-family:sans-serif;margin:20px;line-height:1.6}h1{color:#333}.success{color:green;font-weight:700}.error{color:red;font-weight:700}</style>\n";
echo "</head>\n<body>\n";
echo "<h1>Test PHP Minimal</h1>\n";

echo "<p><span class='success'>PHP fonctionne en mode minimal!</span></p>\n";
echo "<p>Version PHP: " . htmlspecialchars($php_version) . "</p>\n";
echo "<p>Serveur: " . htmlspecialchars($server_software) . "</p>\n";
echo "<p>Nom d'hôte: " . htmlspecialchars($hostname) . "</p>\n";
echo "<p>Script: " . htmlspecialchars($script_name) . "</p>\n";
echo "<p>Document root: " . htmlspecialchars($document_root) . "</p>\n";
echo "<p>Fichier actuel: " . htmlspecialchars($current_file) . "</p>\n";

echo "<h2>Test d'écriture de fichier</h2>\n";
if ($can_write && $file_exists) {
    echo "<p><span class='success'>Écriture réussie</span> Fichier créé: $test_file</p>\n";
} else {
    echo "<p><span class='error'>Impossible d'écrire le fichier de test</span></p>\n";
}

echo "<h2>Variables \$_SERVER</h2>\n";
echo "<pre>\n";
foreach ($_SERVER as $key => $value) {
    if (is_string($value)) {
        echo htmlspecialchars($key) . " = " . htmlspecialchars($value) . "\n";
    }
}
echo "</pre>\n";

echo "<p><a href='/'>Retour à l'accueil</a> | ";
echo "<a href='/api/phpinfo.php'>Voir phpinfo()</a></p>\n";

echo "</body>\n</html>";
?>
