
<?php
// Fichier de diagnostic affichant les informations complètes de configuration PHP
// Utile pour vérifier que PHP fonctionne et voir sa configuration

// En-têtes pour éviter la mise en cache
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Afficher toutes les informations PHP (configuration, modules, etc.)
phpinfo();
?>
