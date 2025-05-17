
<?php
// Script pour réparer les références aux assets dans index.html

// Vérifier si index.html existe
if (!file_exists('index.html')) {
    echo "Erreur: index.html non trouvé.";
    exit;
}

// Lire le contenu du fichier
$html = file_get_contents('index.html');
$modified = false;

// Vérifier et corriger les références aux fichiers CSS
if (strpos($html, 'href="/assets/index.css"') === false && strpos($html, 'href="/assets/main.css"') === false) {
    // Ajouter la référence au CSS si elle n'existe pas déjà
    $html = str_replace('</head>', '  <link rel="stylesheet" href="/assets/main.css">' . "\n</head>", $html);
    $modified = true;
    echo "Référence à main.css ajoutée dans index.html<br>";
}

// Vérifier et corriger les références aux fichiers JS
if (strpos($html, 'src="/assets/index.js"') === false && strpos($html, 'src="/assets/main.js"') === false) {
    // Rechercher la fin du body pour insérer un script de secours
    $html = str_replace('</body>', '  <script src="/assets/main.js"></script>' . "\n</body>", $html);
    $modified = true;
    echo "Référence à main.js ajoutée dans index.html<br>";
}

// Si des modifications ont été faites, enregistrer le fichier
if ($modified) {
    file_put_contents('index.html', $html);
    echo "index.html a été mis à jour avec les bonnes références d'assets.";
} else {
    echo "index.html semble déjà avoir les bonnes références d'assets.";
}

// Vérifier si les fichiers assets existent
if (!file_exists('assets/main.css')) {
    echo "<br>Attention: Le fichier assets/main.css n'existe pas!";
}

if (!file_exists('assets/main.js')) {
    echo "<br>Attention: Le fichier assets/main.js n'existe pas!";
}
?>
