
<?php
// Ce script tentera de contacter directement le moteur PHP
header("Content-Type: text/plain");

echo "=== TEST FORCÉ D'EXÉCUTION PHP ===\n\n";

// Informations de base
echo "Date et heure: " . date("Y-m-d H:i:s") . "\n";
echo "Version PHP: " . phpversion() . "\n";
echo "SAPI: " . php_sapi_name() . "\n\n";

// Vérifier la configuration d'Apache
echo "=== CONFIGURATION APACHE ===\n";
if (function_exists("apache_get_modules")) {
    echo "Modules Apache chargés: " . implode(", ", array_slice(apache_get_modules(), 0, 10)) . "...\n";
    echo "php_module ou php7_module présent: " . 
        (in_array("mod_php", apache_get_modules()) || in_array("mod_php7", apache_get_modules()) ? "OUI" : "NON") . "\n";
} else {
    echo "Fonction apache_get_modules() non disponible - PHP probablement exécuté en mode CGI/FastCGI.\n";
}

// Vérifier les directives PHP importantes
echo "\n=== DIRECTIVES PHP IMPORTANTES ===\n";
$important_directives = ["display_errors", "error_reporting", "log_errors", "error_log", "upload_max_filesize", "post_max_size"];
foreach ($important_directives as $directive) {
    echo "$directive: " . ini_get($directive) . "\n";
}

// Information sur le PATH et l'environnement
echo "\n=== VARIABLES D'ENVIRONNEMENT ===\n";
echo "PATH: " . getenv("PATH") . "\n";
echo "DOCUMENT_ROOT: " . $_SERVER["DOCUMENT_ROOT"] . "\n";
echo "SCRIPT_FILENAME: " . $_SERVER["SCRIPT_FILENAME"] . "\n";
echo "USER: " . (function_exists("posix_getpwuid") ? posix_getpwuid(posix_geteuid())["name"] : "(non disponible)") . "\n";

// Tester l'écriture de fichier
echo "\n=== TEST D'ÉCRITURE DE FICHIER ===\n";
$test_file = "php-write-test-" . time() . ".txt";
$write_result = @file_put_contents($test_file, "Test d'écriture");
if ($write_result !== false) {
    echo "✓ Écriture de fichier réussie ($test_file créé)\n";
    @unlink($test_file); // Supprimer le fichier de test
} else {
    echo "✗ Échec de l'écriture de fichier\n";
}

echo "\n=== FIN DU TEST ===\n";
?>
