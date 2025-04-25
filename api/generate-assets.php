
<?php
// Force l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Définir l'en-tête de contenu
header('Content-Type: text/html; charset=UTF-8');

// Vérifier si le dossier assets existe, sinon le créer
$assets_dir = '../assets';
if (!file_exists($assets_dir)) {
    if (mkdir($assets_dir, 0755, true)) {
        echo "Répertoire assets créé avec succès.<br>";
    } else {
        echo "Impossible de créer le répertoire assets.<br>";
        exit;
    }
} else {
    echo "Le répertoire assets existe déjà.<br>";
}

// Créer un fichier JS minimal
$js_content = <<<EOT
// Ce fichier a été généré automatiquement pour tester le fonctionnement des assets
console.log('Le fichier assets/app.js a été chargé correctement');

function testFunction() {
    document.getElementById('js-test-result').textContent = 'JavaScript fonctionne correctement!';
    document.getElementById('js-test-result').style.color = 'green';
}

// Exécuter automatiquement lors du chargement
window.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, test de la fonction JavaScript');
    if (document.getElementById('js-test-result')) {
        testFunction();
    }
});
EOT;

// Créer un fichier CSS minimal
$css_content = <<<EOT
/* Ce fichier a été généré automatiquement pour tester le fonctionnement des assets */
body {
    font-family: Arial, sans-serif;
    margin: 20px;
    line-height: 1.6;
}

h1 {
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
}

.success {
    color: #27ae60;
    font-weight: bold;
}

.error {
    color: #e74c3c;
    font-weight: bold;
}

.test-container {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    padding: 20px;
    margin: 20px 0;
    border-radius: 5px;
}
EOT;

// Écrire les fichiers
if (file_put_contents("$assets_dir/app.js", $js_content)) {
    echo "Fichier app.js créé avec succès.<br>";
} else {
    echo "Impossible de créer le fichier app.js.<br>";
}

if (file_put_contents("$assets_dir/app.css", $css_content)) {
    echo "Fichier app.css créé avec succès.<br>";
} else {
    echo "Impossible de créer le fichier app.css.<br>";
}

// Créer une page de test HTML
$html_content = <<<EOT
<!DOCTYPE html>
<html>
<head>
    <title>Test des Assets</title>
    <link rel="stylesheet" href="/assets/app.css">
    <script src="/assets/app.js"></script>
</head>
<body>
    <h1>Test des Assets</h1>
    
    <div class="test-container">
        <h2>Test CSS</h2>
        <p>Si vous voyez cette page avec un style appliqué (titre avec bordure bleue), le CSS fonctionne correctement.</p>
    </div>
    
    <div class="test-container">
        <h2>Test JavaScript</h2>
        <p id="js-test-result">Si JavaScript fonctionne, ce texte sera remplacé.</p>
    </div>
    
    <div class="test-container">
        <h2>Informations</h2>
        <p>Date de génération: <strong>{$date}</strong></p>
        <p>Serveur: <strong>{$_SERVER['SERVER_SOFTWARE']}</strong></p>
        <p>PHP Version: <strong>{$phpversion}</strong></p>
    </div>
</body>
</html>
EOT;

// Remplacer les variables
$date = date('Y-m-d H:i:s');
$phpversion = phpversion();
$html_content = str_replace(['{$date}', '{$phpversion}'], [$date, $phpversion], $html_content);

// Écrire le fichier HTML de test
if (file_put_contents("$assets_dir/test.html", $html_content)) {
    echo "Fichier test.html créé avec succès.<br>";
} else {
    echo "Impossible de créer le fichier test.html.<br>";
}

// Afficher un lien vers la page de test
echo '<br><p>Génération des assets terminée.</p>';
echo '<p>Vous pouvez accéder à la <a href="/assets/test.html" target="_blank">page de test des assets</a> pour vérifier leur fonctionnement.</p>';
?>
