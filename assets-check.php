
<?php
// Rediriger vers le vrai fichier dans le dossier api
header('Content-Type: application/json');
require_once __DIR__ . '/api/assets-check.php';
?>
