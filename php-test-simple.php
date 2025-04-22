
<?php
// Test PHP très simple sans aucune dépendance ou inclusion
header('Content-Type: text/plain');
echo "PHP fonctionne correctement! Si vous voyez ce message, le problème d'interprétation PHP est résolu.\n";
echo "Version PHP: " . phpversion() . "\n";
echo "Heure: " . date('Y-m-d H:i:s') . "\n";
?>
