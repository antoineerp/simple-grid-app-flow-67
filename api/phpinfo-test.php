
<?php
// Fichier de test simple pour vérifier si PHP fonctionne correctement
header("Content-Type: text/html; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Cache-Control: no-cache, no-store, must-revalidate");

// Activer l'affichage des erreurs pour ce fichier uniquement
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>PHP fonctionne correctement</h1>";
echo "<p>Version PHP: " . phpversion() . "</p>";
echo "<p>Extensions chargées: " . implode(', ', get_loaded_extensions()) . "</p>";
echo "<hr>";
echo "<h2>Variables serveur</h2>";
echo "<pre>";
print_r($_SERVER);
echo "</pre>";
?>
