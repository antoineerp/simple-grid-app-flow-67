
<?php
header('Content-Type: text/html; charset=utf-8');

function log_message($msg) {
    echo "<p>" . htmlspecialchars($msg) . "</p>";
    error_log($msg);
}

log_message("Démarrage du diagnostic de chemins...");
$document_root = $_SERVER['DOCUMENT_ROOT'];
log_message("Document Root: $document_root");

// Vérifier si nous sommes sur Infomaniak
$is_infomaniak = strpos($document_root, '/home/clients') !== false || 
                 strpos($document_root, '/sites') !== false;

log_message("Détecté comme Infomaniak: " . ($is_infomaniak ? "Oui" : "Non"));

// Trouver le fichier index.html
$index_file = $document_root . '/index.html';
if (!file_exists($index_file)) {
    log_message("ERREUR: index.html non trouvé à $index_file");
} else {
    log_message("index.html trouvé: $index_file");
    $content = file_get_contents($index_file);
    
    // Vérifier les références aux assets
    if (strpos($content, 'src="/src/main.tsx"') !== false) {
        log_message("PROBLÈME: index.html fait référence à /src/main.tsx (développement)");
        
        // Remplacer par la référence compilée
        $content = str_replace(
            'src="/src/main.tsx"', 
            'src="/assets/index.js"', 
            $content
        );
        
        // Supprimer toute référence à GPT Engineer
        $content = preg_replace('/<script.*gptengineer\.js.*<\/script>/i', '', $content);
        
        // Enregistrer le fichier modifié
        $result = file_put_contents($index_file, $content);
        if ($result) {
            log_message("CORRECTION: index.html mis à jour pour utiliser /assets/index.js");
        } else {
            log_message("ERREUR: Impossible de mettre à jour index.html");
        }
    } else {
        log_message("OK: index.html utilise déjà les chemins de production");
    }
}

// Vérifier le dossier assets
$assets_dir = $document_root . '/assets';
if (!is_dir($assets_dir)) {
    log_message("ERREUR: Dossier /assets n'existe pas");
    
    // Essayer de trouver les assets compilés
    $dist_assets = $document_root . '/dist/assets';
    if (is_dir($dist_assets)) {
        log_message("TROUVÉ: Assets compilés dans /dist/assets");
        
        // Créer le dossier assets
        if (!mkdir($assets_dir, 0755, true)) {
            log_message("ERREUR: Impossible de créer le dossier /assets");
        } else {
            log_message("CRÉÉ: Dossier /assets créé");
            
            // Copier les fichiers
            $js_files = glob("$dist_assets/*.js");
            $css_files = glob("$dist_assets/*.css");
            
            foreach ($js_files as $file) {
                $filename = basename($file);
                if (copy($file, "$assets_dir/$filename")) {
                    log_message("COPIÉ: $filename vers /assets/");
                } else {
                    log_message("ERREUR: Impossible de copier $filename");
                }
            }
            
            foreach ($css_files as $file) {
                $filename = basename($file);
                if (copy($file, "$assets_dir/$filename")) {
                    log_message("COPIÉ: $filename vers /assets/");
                } else {
                    log_message("ERREUR: Impossible de copier $filename");
                }
            }
        }
    } else {
        log_message("ERREUR: Aucun dossier d'assets trouvé (ni /assets ni /dist/assets)");
    }
} else {
    log_message("OK: Dossier /assets existe");
    $js_files = glob("$assets_dir/*.js");
    
    if (empty($js_files)) {
        log_message("AVERTISSEMENT: Aucun fichier JavaScript trouvé dans /assets/");
    } else {
        log_message("TROUVÉ: " . count($js_files) . " fichiers JavaScript dans /assets/");
    }
}

log_message("Diagnostic terminé!");
?>

<p><a href="/">Retour à la page d'accueil</a></p>
