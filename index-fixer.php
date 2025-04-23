
<?php
// Script pour corriger automatiquement les références dans index.html
header('Content-Type: text/html; charset=utf-8');

// Chercher les assets compilés réels
$js_files = glob('./assets/*.js');
$css_files = glob('./assets/*.css');

// Trouver le fichier main.js (ou équivalent)
$main_js = '';
foreach ($js_files as $file) {
    if (strpos(basename($file), 'main-') === 0) {
        $main_js = '/assets/' . basename($file);
        break;
    }
}

// Si aucun main-*.js n'est trouvé, prendre le premier .js disponible
if (empty($main_js) && !empty($js_files)) {
    $main_js = '/assets/' . basename($js_files[0]);
}

// Trouver le fichier index.css (ou équivalent)
$index_css = '';
foreach ($css_files as $file) {
    if (strpos(basename($file), 'index-') === 0) {
        $index_css = '/assets/' . basename($file);
        break;
    }
}

// Si aucun index-*.css n'est trouvé, prendre le premier .css disponible
if (empty($index_css) && !empty($css_files)) {
    $index_css = '/assets/' . basename($css_files[0]);
}

// Lire le contenu de index.html
$index_html = file_get_contents('./index.html');

// Message initial
echo "<h1>Correcteur de références pour index.html</h1>";

if (empty($js_files) || empty($css_files)) {
    echo "<p style='color: red;'>ERREUR: Aucun fichier JavaScript ou CSS trouvé dans le dossier /assets/.</p>";
    echo "<p>Veuillez exécuter 'npm run build' pour générer les fichiers compilés avant d'utiliser ce script.</p>";
    exit;
}

echo "<p>Fichiers JS trouvés: " . implode(", ", array_map('basename', $js_files)) . "</p>";
echo "<p>Fichiers CSS trouvés: " . implode(", ", array_map('basename', $css_files)) . "</p>";

// Créer une sauvegarde
copy('./index.html', './index.html.bak');
echo "<p>Sauvegarde créée: index.html.bak</p>";

// Remplacer les références src/
$new_index = preg_replace(
    '/<link[^>]*href=["\']\.\/?src\/index\.css["\'][^>]*>/',
    '<link rel="stylesheet" href="' . $index_css . '">',
    $index_html
);

$new_index = preg_replace(
    '/<script[^>]*src=["\']\.\/?src\/main\.tsx["\'][^>]*>/',
    '<script type="module" src="' . $main_js . '"></script>',
    $new_index
);

// Écrire le nouvel index.html
file_put_contents('./index.html', $new_index);

echo "<p style='color: green;'>index.html a été mis à jour pour référencer les fichiers compilés:</p>";
echo "<ul>";
echo "<li>CSS: " . $index_css . "</li>";
echo "<li>JS: " . $main_js . "</li>";
echo "</ul>";

echo "<p>Contenu mis à jour de index.html:</p>";
echo "<pre>" . htmlspecialchars($new_index) . "</pre>";

echo "<p><a href='/' style='padding: 10px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;'>Retour au site</a></p>";
?>
