
<?php
header('Content-Type: text/html; charset=utf-8');
echo "<h1>Test d'exécution PHP</h1>";
echo "<p>Si vous voyez ce message, PHP fonctionne correctement via le web.</p>";
echo "<p>Date et heure: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Version PHP: " . phpversion() . "</p>";
echo "<p>Extensions chargées: " . implode(', ', array_slice(get_loaded_extensions(), 0, 10)) . "...</p>";
?>
