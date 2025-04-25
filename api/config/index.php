
<?php
// Bloquer l'accès direct à ce répertoire
header("HTTP/1.1 403 Forbidden");
echo json_encode([
    'status' => 403,
    'message' => 'Accès interdit',
    'detail' => 'L\'accès direct au répertoire de configuration n\'est pas autorisé.'
]);
exit;
?>
