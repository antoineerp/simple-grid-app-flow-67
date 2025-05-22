
<?php
// Forcer l'affichage en mode texte
header("Content-Type: text/plain; charset=UTF-8");
?>
Test d'exécution PHP dans le dossier /api

Version PHP: <?php echo phpversion(); ?>

Date et heure actuelles: <?php echo date('Y-m-d H:i:s'); ?>

Informations sur le serveur:
<?php print_r($_SERVER); ?>

Ce fichier sert à vérifier que PHP s'exécute correctement dans le dossier /api.
Si vous voyez ce message formaté, PHP fonctionne.
