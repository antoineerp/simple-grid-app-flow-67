
<?php
// Test simple pour vérifier si PHP fonctionne
header("Content-Type: text/html; charset=UTF-8");

echo "<html><head><title>PHP Test</title></head><body>";
echo "<h1>PHP Test</h1>";
echo "<p>PHP est fonctionnel. Version " . phpversion() . "</p>";
echo "<p>Heure du serveur: " . date('Y-m-d H:i:s') . "</p>";

echo "<h2>Extensions PHP chargées</h2>";
echo "<ul>";
$extensions = get_loaded_extensions();
sort($extensions);
foreach ($extensions as $ext) {
    echo "<li>$ext</li>";
}
echo "</ul>";

echo "<h2>Variables serveur</h2>";
echo "<table border='1'>";
echo "<tr><th>Nom</th><th>Valeur</th></tr>";
foreach ($_SERVER as $key => $value) {
    echo "<tr><td>$key</td><td>" . htmlspecialchars($value) . "</td></tr>";
}
echo "</table>";

echo "</body></html>";
?>
