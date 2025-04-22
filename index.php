
<?php
// Point d'entrée minimaliste
header('Content-Type: text/html; charset=utf-8');

// Servir le contenu HTML de base
echo '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FormaCert</title>
    <link rel="icon" href="/lovable-uploads/formacert-logo.png" type="image/png">
    
    <!-- Styles avec fallback direct vers le dossier dist -->
    <link rel="stylesheet" href="/dist/assets/index.css" type="text/css">
</head>
<body>
    <div id="root"></div>
    
    <!-- Script Lovable (chargé en permanence) -->
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
    
    <!-- Script principal avec fallback -->
    <script src="/dist/assets/index.js" type="module"></script>
</body>
</html>';
?>
