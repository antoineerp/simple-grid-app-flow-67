
<?php
// Définir le type de contenu en texte simple
header('Content-Type: text/plain; charset=utf-8');

// Afficher un message simple
echo "PHP FONCTIONNE - TEST MINIMAL\n";
echo "Date serveur: " . date('Y-m-d H:i:s') . "\n";
echo "Version PHP: " . phpversion() . "\n";
?>
