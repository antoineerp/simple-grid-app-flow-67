
<?php
// Simple index.php pour servir l'application React depuis la racine
// Cela résout l'erreur 500 sur certains hébergements comme Infomaniak

// Définir les bons en-têtes
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Vérifier si index.html existe
if (file_exists('./index.html')) {
    // Option 1: Lire et afficher le contenu
    echo file_get_contents('./index.html');
} else {
    // En cas d'erreur, afficher une page de secours
    echo '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FormaCert</title>
    <style>
        body { font-family: sans-serif; text-align: center; margin-top: 50px; }
        .error { color: #e53e3e; }
        button { background: #4299e1; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>FormaCert</h1>
    <p>L\'application est en cours de chargement...</p>
    <p class="error">Si cette page persiste, veuillez actualiser votre navigateur.</p>
    <button onclick="window.location.reload()">Actualiser</button>
    <div id="root"></div>
    <script src="/dist/assets/index.js"></script>
</body>
</html>';
}
?>
