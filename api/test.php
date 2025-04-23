
<?php
// Script PHP minimal pour vérifier l'exécution
header('Content-Type: application/json; charset=UTF-8');
echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
