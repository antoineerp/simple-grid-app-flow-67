
<?php
// Définir explicitement le type de contenu pour éviter les problèmes d'interprétation
header('Content-Type: text/plain; charset=utf-8');

// Afficher des informations très simples pour vérifier l'interprétation PHP
echo "PHP FONCTIONNE CORRECTEMENT!\n";
echo "------------------------------\n";
echo "Si vous voyez ce message, PHP est correctement interprété par le serveur.\n\n";
echo "Version PHP: " . phpversion() . "\n";
echo "Date et heure: " . date('Y-m-d H:i:s') . "\n";
echo "Serveur: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Information non disponible') . "\n";
echo "API PHP: " . php_sapi_name() . "\n";
echo "\nLes fichiers PHP ne devraient plus se télécharger maintenant.";
?>
