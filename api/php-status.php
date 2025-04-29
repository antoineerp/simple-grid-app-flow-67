
<?php
// Fichier simple pour vérifier l'exécution PHP
header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne correctement',
    'version' => phpversion(),
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_SOFTWARE']
]);
?>
