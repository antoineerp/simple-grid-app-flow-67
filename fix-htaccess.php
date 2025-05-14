
<?php
header('Content-Type: text/html; charset=utf-8');

$htaccess_file = '.htaccess';
$message = '';
$status = '';

if (file_exists($htaccess_file)) {
    $content = file_get_contents($htaccess_file);
    $original = $content;
    
    // Remplacer les chemins incorrects
    $content = str_replace('/sites/qualiopi.ch', '', $content);
    $content = str_replace('sites/qualiopi.ch', '', $content);
    $content = str_replace('/home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch', '', $content);
    
    if ($content !== $original) {
        if (file_put_contents($htaccess_file, $content)) {
            $message = "Le fichier .htaccess a été corrigé avec succès.";
            $status = 'success';
        } else {
            $message = "Impossible de mettre à jour le fichier .htaccess.";
            $status = 'error';
        }
    } else {
        $message = "Aucune correction nécessaire dans le fichier .htaccess.";
        $status = 'info';
    }
} else {
    $message = "Le fichier .htaccess n'existe pas.";
    $status = 'error';
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Correction du fichier .htaccess</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Correction du fichier .htaccess</h1>
    
    <p class="<?php echo $status; ?>"><?php echo $message; ?></p>
    
    <p><a href="check-infomaniak.php">Retour à la vérification</a></p>
</body>
</html>
