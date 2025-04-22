
<?php
// Point d'entrée minimal pour servir l'application React
// Pour résoudre l'erreur 500 sur Infomaniak

// Définir l'encodage UTF-8
header('Content-Type: text/html; charset=utf-8');

// Servir le contenu HTML de base
echo '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FormaCert</title>
    <link rel="icon" href="/lovable-uploads/formacert-logo.png" type="image/png">
    <link rel="stylesheet" href="/dist/assets/index.css">
</head>
<body>
    <div id="root"></div>
    <noscript>
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
            <p>Cette application nécessite JavaScript pour fonctionner.</p>
        </div>
    </noscript>
    <script src="/dist/assets/index.js"></script>
</body>
</html>';
?>
