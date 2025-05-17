
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
        // Créer un CSS de base
        $css = "/* CSS de secours généré automatiquement */\n";
        $css .= "body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }\n";
        $css .= "#root { max-width: 1280px; margin: 0 auto; padding: 2rem; }\n";
        file_put_contents($mainCss, $css);
        echo "CSS de secours créé dans $mainCss";
    }
}

// Rediriger vers la page d'accueil après 3 secondes
echo "<p>Vérification CSS terminée. Redirection dans 3 secondes...</p>";
echo "<script>setTimeout(() => { window.location.href = '/'; }, 3000);</script>";
?>
