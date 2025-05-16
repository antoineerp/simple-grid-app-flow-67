
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Synchronisation complète des assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        table { border-collapse: collapse; width: 100%; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Synchronisation complète des assets</h1>
    
    <div class="section">
        <h2>État actuel</h2>
        <?php
        // Vérifier l'existence des dossiers et fichiers importants
        $folders = [
            'assets' => is_dir('./assets'),
            'dist' => is_dir('./dist'),
            'dist/assets' => is_dir('./dist/assets'),
            'src' => is_dir('./src'),
        ];
        
        $files = [
            'index.html' => file_exists('./index.html'),
            'src/index.css' => file_exists('./src/index.css'),
            'src/main.tsx' => file_exists('./src/main.tsx'),
        ];
        
        echo "<h3>Dossiers</h3>";
        echo "<ul>";
        foreach ($folders as $folder => $exists) {
            echo "<li>$folder: " . ($exists ? "<span class='success'>Existe</span>" : "<span class='error'>N'existe pas</span>") . "</li>";
        }
        echo "</ul>";
        
        echo "<h3>Fichiers</h3>";
        echo "<ul>";
        foreach ($files as $file => $exists) {
            echo "<li>$file: " . ($exists ? "<span class='success'>Existe</span>" : "<span class='error'>N'existe pas</span>") . "</li>";
        }
        echo "</ul>";
        ?>
    </div>
    
    <?php
    // Traitement de la demande de synchronisation complète
    if (isset($_POST['sync_all'])) {
        // Étape 1: Création du dossier assets si nécessaire
        if (!is_dir('./assets')) {
            if (mkdir('./assets', 0755, true)) {
                echo "<div class='section'><p class='success'>Dossier assets créé avec succès.</p></div>";
            } else {
                echo "<div class='section'><p class='error'>Impossible de créer le dossier assets.</p></div>";
            }
        }
        
        // Étape 2: Copier les fichiers de dist/assets vers assets
        $copied_files = [];
        $failed_files = [];
        
        if (is_dir('./dist/assets')) {
            $dist_files = glob('./dist/assets/*');
            foreach ($dist_files as $file) {
                $filename = basename($file);
                $dest = './assets/' . $filename;
                
                if (copy($file, $dest)) {
                    $copied_files[] = $filename;
                } else {
                    $failed_files[] = $filename;
                }
            }
        }
        
        if (!empty($copied_files)) {
            echo "<div class='section'>";
            echo "<h3>Fichiers copiés avec succès</h3>";
            echo "<ul>";
            foreach ($copied_files as $file) {
                echo "<li><span class='success'>$file</span></li>";
            }
            echo "</ul>";
            echo "</div>";
        }
        
        if (!empty($failed_files)) {
            echo "<div class='section'>";
            echo "<h3>Échecs de copie</h3>";
            echo "<ul>";
            foreach ($failed_files as $file) {
                echo "<li><span class='error'>$file</span></li>";
            }
            echo "</ul>";
            echo "</div>";
        }
        
        // Étape 3: Créer un fichier CSS principal s'il n'existe pas
        $css_files = glob('./assets/*.css');
        if (empty($css_files)) {
            // Chercher le contenu CSS original
            $src_css = '';
            if (file_exists('./src/index.css')) {
                $src_css = file_get_contents('./src/index.css');
                echo "<div class='section'><p class='success'>Contenu CSS récupéré depuis src/index.css.</p></div>";
            } else {
                $src_css = <<<EOT
/* Fichier CSS principal généré automatiquement */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 210 100% 35%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

button, .btn {
  cursor: pointer;
  border-radius: var(--radius);
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: background-color 0.2s, opacity 0.2s;
}

.btn-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border: none;
}

.btn-primary:hover {
  opacity: 0.9;
}

input, select, textarea {
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid hsl(var(--border));
}

.card {
  background-color: white;
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}
EOT;
                echo "<div class='section'><p class='warning'>CSS généré par défaut (src/index.css non trouvé).</p></div>";
            }
            
            // Générer un nom de fichier avec un hash
            $css_filename = 'main.' . substr(md5(time()), 0, 8) . '.css';
            
            // Enregistrer le fichier CSS
            if (file_put_contents('./assets/' . $css_filename, $src_css)) {
                echo "<div class='section'><p class='success'>Fichier CSS principal créé: $css_filename</p></div>";
            } else {
                echo "<div class='section'><p class='error'>Impossible de créer le fichier CSS principal</p></div>";
            }
        } else {
            echo "<div class='section'><p class='success'>Des fichiers CSS existent déjà dans le dossier assets.</p></div>";
        }
        
        // Étape 4: Mettre à jour index.html
        if (file_exists('./index.html')) {
            // Créer une sauvegarde
            copy('./index.html', './index.html.bak-' . date('YmdHis'));
            
            $content = file_get_contents('./index.html');
            $updated = false;
            
            // Trouver les fichiers principaux
            $js_files = glob('./assets/*.js');
            $css_files = glob('./assets/*.css');
            
            $main_js = '';
            foreach ($js_files as $file) {
                if (strpos(basename($file), 'main.') === 0) {
                    $main_js = '/assets/' . basename($file);
                    break;
                }
            }
            
            $main_css = '';
            foreach ($css_files as $file) {
                if (strpos(basename($file), 'main.') === 0) {
                    $main_css = '/assets/' . basename($file);
                    break;
                } else if (strpos(basename($file), 'index.') === 0) {
                    $main_css = '/assets/' . basename($file);
                }
            }
            
            if (!empty($main_js)) {
                // Remplacer ou ajouter la référence JS
                if (preg_match('/<script[^>]*type="module"[^>]*src="[^"]*\/src\/main\.tsx"[^>]*>/', $content)) {
                    $content = preg_replace(
                        '/<script[^>]*type="module"[^>]*src="[^"]*\/src\/main\.tsx"[^>]*>/',
                        '<script type="module" src="' . $main_js . '">',
                        $content
                    );
                    $updated = true;
                    echo "<div class='section'><p class='success'>Référence JS mise à jour dans index.html: $main_js</p></div>";
                } else if (!strpos($content, $main_js)) {
                    // Si la référence n'existe pas, l'ajouter
                    $content = str_replace(
                        '</body>',
                        '  <script type="module" src="' . $main_js . '"></script>' . "\n</body>",
                        $content
                    );
                    $updated = true;
                    echo "<div class='section'><p class='success'>Référence JS ajoutée à index.html: $main_js</p></div>";
                }
            }
            
            if (!empty($main_css)) {
                // Remplacer ou ajouter la référence CSS
                if (preg_match('/<link[^>]*rel="stylesheet"[^>]*href="[^"]*\/src\/index\.css"[^>]*>/', $content)) {
                    $content = preg_replace(
                        '/<link[^>]*rel="stylesheet"[^>]*href="[^"]*\/src\/index\.css"[^>]*>/',
                        '<link rel="stylesheet" href="' . $main_css . '">',
                        $content
                    );
                    $updated = true;
                    echo "<div class='section'><p class='success'>Référence CSS mise à jour dans index.html: $main_css</p></div>";
                } else if (!strpos($content, $main_css)) {
                    // Si la référence n'existe pas, l'ajouter
                    $content = str_replace(
                        '</head>',
                        '  <link rel="stylesheet" href="' . $main_css . '">' . "\n</head>",
                        $content
                    );
                    $updated = true;
                    echo "<div class='section'><p class='success'>Référence CSS ajoutée à index.html: $main_css</p></div>";
                }
            }
            
            // Vérifier que la référence à GPT Engineer existe
            if (!strpos($content, 'https://cdn.gpteng.co/gptengineer.js')) {
                $content = str_replace(
                    '</body>',
                    '  <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>' . "\n</body>",
                    $content
                );
                $updated = true;
                echo "<div class='section'><p class='success'>Référence à GPT Engineer ajoutée à index.html</p></div>";
            }
            
            // Enregistrer les modifications
            if ($updated) {
                if (file_put_contents('./index.html', $content)) {
                    echo "<div class='section'><p class='success'>index.html mis à jour avec succès.</p></div>";
                } else {
                    echo "<div class='section'><p class='error'>Impossible de mettre à jour index.html.</p></div>";
                }
            } else {
                echo "<div class='section'><p class='success'>Aucune modification nécessaire pour index.html.</p></div>";
            }
        } else {
            echo "<div class='section'><p class='error'>Fichier index.html introuvable.</p></div>";
        }
    }
    ?>
    
    <div class="section">
        <h2>Synchronisation complète</h2>
        <p>Cette action va:</p>
        <ol>
            <li>Copier tous les fichiers de dist/assets vers assets/</li>
            <li>Créer un fichier CSS principal s'il n'existe pas</li>
            <li>Mettre à jour index.html pour référencer les bons fichiers</li>
        </ol>
        
        <form method="post">
            <button type="submit" name="sync_all" class="button">Synchroniser tous les assets</button>
        </form>
    </div>
    
    <div class="section">
        <h2>Liens utiles</h2>
        <ul>
            <li><a href="verify-hash-files.php">Vérifier les fichiers hachés</a></li>
            <li><a href="index.html">Retour à l'application</a></li>
        </ul>
    </div>
</body>
</html>
