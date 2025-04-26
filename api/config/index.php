
<?php
// Empêcher l'accès direct au répertoire
if (!defined('DIRECT_ACCESS_CHECK')) {
    header('HTTP/1.0 403 Forbidden');
    echo 'Accès refusé';
    exit;
}

// Redirection vers l'API principale
header('Location: ../index.php');
exit;
?>
