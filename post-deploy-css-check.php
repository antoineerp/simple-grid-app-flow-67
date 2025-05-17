
<?php
// Ce script est exécuté automatiquement après le déploiement pour s'assurer que les CSS sont correctement déployés
header('Content-Type: text/html; charset=utf-8');

// Faire un check immédiat pour main.css
$mainCss = 'assets/main.css';
if (!file_exists($mainCss)) {
    echo "ERREUR: $mainCss n'existe pas. Tentative de correction...";
    
    // Vérifier s'il existe un fichier CSS dans le dossier assets
    $cssFiles = glob('assets/*.css');
    if (!empty($cssFiles)) {
        // Copier le premier fichier CSS trouvé vers main.css
        copy($cssFiles[0], $mainCss);
        echo "Fichier CSS copié vers $mainCss: " . basename($cssFiles[0]);
    } else {
        // Chercher dans le dossier dist/assets
        $distCssFiles = glob('dist/assets/*.css');
        if (!empty($distCssFiles)) {
            // Créer le dossier assets si nécessaire
            if (!is_dir('assets')) {
                mkdir('assets', 0755, true);
            }
            // Copier le premier CSS trouvé
            copy($distCssFiles[0], $mainCss);
            echo "Fichier CSS copié depuis dist vers $mainCss: " . basename($distCssFiles[0]);
        } else {
            // Créer un CSS de base
            $css = "/* CSS de secours généré automatiquement */\n";
            $css .= "body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }\n";
            $css .= "#root { max-width: 1280px; margin: 0 auto; padding: 2rem; }\n";
            file_put_contents($mainCss, $css);
            echo "CSS de secours créé dans $mainCss";
        }
    }
}

// Vérifier index.html et s'assurer qu'il contient la référence vers main.css
if (file_exists('index.html')) {
    $html = file_get_contents('index.html');
    if (strpos($html, 'href="/assets/main.css"') === false) {
        // Ajouter la référence CSS avant la fermeture du head
        $html = str_replace('</head>', '<link rel="stylesheet" href="/assets/main.css">'."\n".'</head>', $html);
        file_put_contents('index.html', $html);
        echo "<p>Référence à main.css ajoutée dans index.html</p>";
    } else {
        echo "<p>index.html contient déjà une référence à main.css</p>";
    }
} else {
    echo "<p>ERREUR: index.html est manquant</p>";
}

// Rediriger vers la page d'accueil après 5 secondes
echo "<p>Vérification CSS terminée. Redirection dans 5 secondes...</p>";
echo "<script>setTimeout(() => { window.location.href = '/'; }, 5000);</script>";
?>
