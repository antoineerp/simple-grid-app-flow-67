
<?php
// Définir le type de contenu en texte simple pour un meilleur diagnostic
header('Content-Type: text/plain');

// Information basique
echo "PHP Test - FormaCert\n";
echo "------------------------\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Server Time: " . date('Y-m-d H:i:s') . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "\nSi vous pouvez voir ce message, PHP fonctionne correctement!";
?>
