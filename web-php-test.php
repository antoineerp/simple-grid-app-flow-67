
<?php
header('Content-Type: text/html; charset=utf-8');
echo "<h1>Test PHP</h1>";
echo "<p>PHP fonctionne correctement sur ce serveur.</p>";
echo "<p>Version PHP: " . phpversion() . "</p>";
echo "<p>Date et heure du serveur: " . date("Y-m-d H:i:s") . "</p>";
echo "<h2>Variables d'environnement</h2>";
echo "<pre>";
print_r($_SERVER);
echo "</pre>";
?>
