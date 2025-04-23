
<?php
// Test PHP très simple sans dépendances ni fonctions complexes
header('Content-Type: application/json; charset=UTF-8');

echo json_encode([
    'status' => 'success',
    'message' => 'PHP fonctionne correctement',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
