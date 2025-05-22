
<?php
header('Content-Type: text/html; charset=utf-8');

// Configuration
$config = [
    'create_directories' => true,
    'copy_dist_assets' => true,
    'fix_index_html' => true,
    'fix_htaccess' => true,
    'ensure_css_extraction' => true,
    'fix_js_references' => true,
    'create_vite_config' => true,  // New option to create vite.config if missing
    'force_build' => false
];

// Fonction pour journaliser les opérations
function log_operation($operation, $success, $message) {
    return [
        'operation' => $operation,
        'success' => $success,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
}

// Liste des opérations effectuées
$operations = [];

// 1. Vérifier et créer les répertoires nécessaires
function check_create_directories() {
    $dirs = ['assets', 'dist', 'dist/assets', 'src'];
    $results = [];
    
    foreach ($dirs as $dir) {
        if (!file_exists('./' . $dir)) {
            if (mkdir('./' . $dir, 0755, true)) {
                $results[] = log_operation("Création du répertoire $dir", true, "Répertoire créé avec succès");
            } else {
                $results[] = log_operation("Création du répertoire $dir", false, "Impossible de créer le répertoire");
            }
        } else {
            $results[] = log_operation("Vérification du répertoire $dir", true, "Le répertoire existe déjà");
        }
    }
    
    return $results;
}

// 2. Création d'un CSS par défaut si nécessaire
function ensure_default_css() {
    if (!file_exists('./assets/index.css')) {
        $default_css = <<<EOT
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Styles globaux */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f9fafb;
  color: #1f2937;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem;
}

/* Utilitaires */
.text-center {
  text-align: center;
}
EOT;
        
        if (file_put_contents('./assets/index.css', $default_css)) {
            return log_operation("Création du CSS par défaut", true, "CSS par défaut créé avec succès");
        } else {
            return log_operation("Création du CSS par défaut", false, "Impossible de créer le CSS par défaut");
        }
    }
    
    // Copier dans src/index.css aussi
    if (!file_exists('./src/index.css') && file_exists('./assets/index.css')) {
        if (!is_dir('./src')) {
            mkdir('./src', 0755, true);
        }
        
        if (copy('./assets/index.css', './src/index.css')) {
            return log_operation("Copie du CSS vers src", true, "CSS copié vers src/index.css avec succès");
        } else {
            return log_operation("Copie du CSS vers src", false, "Impossible de copier le CSS vers src");
        }
    }
    
    return log_operation("Vérification du CSS", true, "Le fichier CSS existe déjà");
}

// 3. Créer un fichier JavaScript minimal si nécessaire
function ensure_default_js() {
    if (!file_exists('./assets/index.js')) {
        $default_js = <<<EOT
// Fichier JavaScript par défaut pour FormaCert
console.log('Application FormaCert chargée');

// Dynamiquement charger le CSS
function loadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

// S'assurer que le CSS est chargé
if (!document.querySelector('link[href*="index.css"]')) {
    loadCSS('/assets/index.css');
}

// Injecter un élément racine si nécessaire
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('root')) {
        const root = document.createElement('div');
        root.id = 'root';
        document.body.prepend(root);
    }
});
EOT;
        
        if (file_put_contents('./assets/index.js', $default_js)) {
            return log_operation("Création du JS par défaut", true, "JS par défaut créé avec succès");
        } else {
            return log_operation("Création du JS par défaut", false, "Impossible de créer le JS par défaut");
        }
    }
    
    return log_operation("Vérification du JS", true, "Le fichier JS existe déjà");
}

// Créer un fichier main.tsx par défaut si nécessaire
function ensure_main_tsx() {
    if (!file_exists('./src/main.tsx')) {
        $default_main_tsx = <<<EOT
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Composant App simple par défaut
const App = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700">Qualite.cloud</h1>
        <p className="text-gray-600">Système de Management de la Qualité</p>
      </header>
      <main>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Bienvenue</h2>
          <p>Cette application est en cours de chargement ou de déploiement.</p>
          <p className="mt-4">Si vous voyez cette page, le déploiement de base a réussi mais l'application complète n'est pas encore chargée.</p>
        </div>
      </main>
    </div>
  );
};

try {
  console.log("Application starting...");
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found!");
    document.body.innerHTML = '<div style="text-align:center; padding:20px;"><h1>Erreur</h1><p>L\\'élément racine est introuvable.</p></div>';
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log("Application mounted successfully");
  }
} catch (error) {
  console.error("Failed to render application:", error);
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  document.body.innerHTML = `<div style="text-align:center; padding:20px;"><h1>Erreur</h1><p>\${message}</p></div>`;
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});
EOT;
        
        if (!is_dir('./src')) {
            mkdir('./src', 0755, true);
        }
        
        if (file_put_contents('./src/main.tsx', $default_main_tsx)) {
            return log_operation("Création de main.tsx", true, "main.tsx créé avec succès");
        } else {
            return log_operation("Création de main.tsx", false, "Impossible de créer main.tsx");
        }
    }
    
    return log_operation("Vérification de main.tsx", true, "Le fichier main.tsx existe déjà");
}

// 4. Vérifier et créer index.html si nécessaire
function ensure_index_html() {
    if (!file_exists('./index.html')) {
        $default_html = <<<EOT
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Qualite.cloud - Système de Management de la Qualité</title>
    <meta name="description" content="Application web pour la gestion de la qualité et la conformité ISO 27001" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <link rel="stylesheet" href="/assets/index.css">
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOT;
        
        if (file_put_contents('./index.html', $default_html)) {
            return log_operation("Création de index.html", true, "index.html créé avec succès");
        } else {
            return log_operation("Création de index.html", false, "Impossible de créer index.html");
        }
    } else {
        // Mettre à jour index.html avec les bonnes références
        $content = file_get_contents('./index.html');
        $original = $content;
        $updated = false;
        
        // Vérifier/ajouter la référence CSS
        if (strpos($content, '<link rel="stylesheet" href="/assets/index.css">') === false) {
            $content = str_replace('</head>', '  <link rel="stylesheet" href="/assets/index.css">' . "\n  " . '</head>', $content);
            $updated = true;
        }
        
        // Vérifier/mettre à jour la référence JS
        if (strpos($content, 'src="/src/main.tsx"') !== false) {
            // OK, déjà correct
        } else if (strpos($content, 'src="/assets/index.js"') === false) {
            $content = str_replace('</body>', '  <script type="module" src="/assets/index.js"></script>' . "\n  " . '</body>', $content);
            $updated = true;
        }
        
        // Vérifier le script GPT Engineer
        if (strpos($content, 'src="https://cdn.gpteng.co/gptengineer.js"') === false) {
            $content = str_replace('<head>', '<head>' . "\n  " . '<script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>', $content);
            $updated = true;
        }
        
        if ($updated) {
            if (file_put_contents('./index.html', $content)) {
                return log_operation("Mise à jour de index.html", true, "Références mises à jour avec succès");
            } else {
                return log_operation("Mise à jour de index.html", false, "Impossible de mettre à jour index.html");
            }
        }
        
        return log_operation("Vérification de index.html", true, "index.html est déjà correctement configuré");
    }
}

// 5. Vérifier et corriger .htaccess si nécessaire
function ensure_htaccess() {
    if (!file_exists('./.htaccess')) {
        $default_htaccess = <<<EOT
# Activer le moteur de réécriture
RewriteEngine On

# Configuration de base
Options -MultiViews
Options +FollowSymLinks

# Définir le point d'entrée principal
DirectoryIndex index.html index.php

# Définir les types MIME sans les forcer
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css

# Assurer que PHP est correctement interprété
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>

# Permettre l'accès direct aux ressources statiques
RewriteCond %{REQUEST_URI} \.(js|mjs|css|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|map|tsx?|json|php)$
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Rediriger les autres requêtes vers index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ index.html [QSA,L]

# Configuration CORS simplifiée
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>

# Gestion des erreurs personnalisée
ErrorDocument 404 /index.html
EOT;
        
        if (file_put_contents('./.htaccess', $default_htaccess)) {
            return log_operation("Création de .htaccess", true, ".htaccess créé avec succès");
        } else {
            return log_operation("Création de .htaccess", false, "Impossible de créer .htaccess");
        }
    } else {
        // Vérifier si la règle PHP est présente
        $content = file_get_contents('./.htaccess');
        if (strpos($content, 'SetHandler application/x-httpd-php') === false) {
            $content .= "\n\n# Assurer que PHP est correctement interprété\n<FilesMatch \"\\.php$\">\n    SetHandler application/x-httpd-php\n</FilesMatch>\n";
            
            if (file_put_contents('./.htaccess', $content)) {
                return log_operation("Mise à jour de .htaccess", true, "Règle PHP ajoutée avec succès");
            } else {
                return log_operation("Mise à jour de .htaccess", false, "Impossible de mettre à jour .htaccess");
            }
        }
        
        return log_operation("Vérification de .htaccess", true, ".htaccess est déjà correctement configuré");
    }
}

// 6. Synchroniser les assets entre dist et la racine
function sync_assets() {
    // Copier les fichiers du répertoire assets vers dist/assets
    if (is_dir('./assets') && is_dir('./dist/assets')) {
        $copied = 0;
        foreach (glob('./assets/*') as $file) {
            $filename = basename($file);
            if (copy($file, './dist/assets/' . $filename)) {
                $copied++;
            }
        }
        
        if ($copied > 0) {
            return log_operation("Synchronisation des assets", true, "$copied fichiers copiés depuis assets vers dist/assets");
        }
    }
    
    // Créer un fichier dist/assets/index.css s'il n'existe pas
    if (!file_exists('./dist/assets/index.css') && file_exists('./assets/index.css')) {
        if (copy('./assets/index.css', './dist/assets/index.css')) {
            return log_operation("Copie de CSS vers dist", true, "index.css copié vers dist/assets");
        }
    }
    
    // Créer un fichier dist/assets/main.js s'il n'existe pas
    if (!file_exists('./dist/assets/main.js') && file_exists('./assets/index.js')) {
        if (copy('./assets/index.js', './dist/assets/main.js')) {
            return log_operation("Copie de JS vers dist", true, "index.js copié vers dist/assets/main.js");
        }
    }
    
    return log_operation("Synchronisation des assets", false, "Aucun fichier n'a pu être copié ou les répertoires n'existent pas");
}

// 7. Créer vite.config.js/ts s'il n'existe pas
function create_vite_config() {
    $config_types = ['js', 'ts'];
    
    foreach ($config_types as $type) {
        if (file_exists("./vite.config.$type")) {
            // Mettre à jour la configuration existante
            $content = file_get_contents("./vite.config.$type");
            
            if (strpos($content, 'cssCodeSplit') === false) {
                if (preg_match('/build\s*:\s*{/i', $content)) {
                    $content = preg_replace(
                        '/(build\s*:\s*{)/i',
                        "$1\n    cssCodeSplit: true,",
                        $content
                    );
                } else if (preg_match('/export\s+default\s+defineConfig\s*\(\s*{/i', $content)) {
                    $content = preg_replace(
                        '/(export\s+default\s+defineConfig\s*\(\s*{)/i',
                        "$1\n  build: {\n    cssCodeSplit: true,\n    outDir: 'dist',\n    assetsDir: 'assets'\n  },",
                        $content
                    );
                }
                
                file_put_contents("./vite.config.$type", $content);
                return log_operation("Mise à jour de vite.config.$type", true, "Configuration mise à jour pour l'extraction CSS");
            }
            
            return log_operation("Vérification de vite.config.$type", true, "Configuration déjà correcte");
        }
    }
    
    // Créer un nouveau fichier vite.config.js s'il n'existe pas
    $default_vite_config = <<<EOT
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) {
            return 'assets/[name].[hash].[ext]';
          }
          const info = assetInfo.name.split('.');
          const ext = info.pop();
          const name = info.join('.');
          return `assets/\${name}.\${ext}`;
        },
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
});
EOT;
    
    if (file_put_contents('./vite.config.js', $default_vite_config)) {
        return log_operation("Création de vite.config.js", true, "Configuration Vite créée avec succès");
    } else {
        return log_operation("Création de vite.config.js", false, "Impossible de créer le fichier de configuration");
    }
}

// 8. Vérifier l'import CSS dans main.tsx
function check_css_import() {
    $main_files = ['src/main.tsx', 'src/main.js', 'src/index.tsx', 'src/index.js'];
    
    foreach ($main_files as $main_file) {
        if (file_exists('./' . $main_file)) {
            $content = file_get_contents('./' . $main_file);
            
            if (strpos($content, "import './index.css'") === false && 
                strpos($content, "import '../index.css'") === false) {
                
                // Ajouter l'import au début du fichier
                $content = "import './index.css';\n" . $content;
                
                if (file_put_contents('./' . $main_file, $content)) {
                    return log_operation("Correction de $main_file", true, "Import CSS ajouté avec succès");
                } else {
                    return log_operation("Correction de $main_file", false, "Impossible de mettre à jour le fichier");
                }
            } else {
                return log_operation("Vérification de $main_file", true, "L'import CSS est déjà présent");
            }
        }
    }
    
    return log_operation("Vérification de l'import CSS", false, "Aucun fichier principal trouvé");
}

// 9. Créer un fichier src/index.css s'il n'existe pas
function ensure_src_index_css() {
    if (!file_exists('./src/index.css')) {
        if (!is_dir('./src')) {
            mkdir('./src', 0755, true);
        }
        
        $css_content = '';
        
        // Copier depuis assets/index.css si disponible
        if (file_exists('./assets/index.css')) {
            $css_content = file_get_contents('./assets/index.css');
        } else {
            $css_content = <<<EOT
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Styles de base */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f9fafb;
  color: #1f2937;
}
EOT;
        }
        
        if (file_put_contents('./src/index.css', $css_content)) {
            return log_operation("Création de src/index.css", true, "Fichier CSS source créé avec succès");
        } else {
            return log_operation("Création de src/index.css", false, "Impossible de créer le fichier CSS source");
        }
    }
    
    return log_operation("Vérification de src/index.css", true, "Le fichier CSS source existe déjà");
}

// Exécuter toutes les opérations
$all_operations = [];

// 1. Créer les répertoires nécessaires
if ($config['create_directories']) {
    $all_operations = array_merge($all_operations, check_create_directories());
}

// 2. Assurer la présence du CSS par défaut
$all_operations[] = ensure_default_css();

// 3. Assurer la présence du JS par défaut
$all_operations[] = ensure_default_js();

// 4. Créer main.tsx s'il n'existe pas
$all_operations[] = ensure_main_tsx();

// 5. Vérifier/créer index.html
$all_operations[] = ensure_index_html();

// 6. Vérifier/corriger .htaccess
if ($config['fix_htaccess']) {
    $all_operations[] = ensure_htaccess();
}

// 7. Synchroniser les assets
if ($config['copy_dist_assets']) {
    $all_operations[] = sync_assets();
}

// 8. Créer/corriger vite.config.js/ts
if ($config['create_vite_config']) {
    $all_operations[] = create_vite_config();
}

// 9. Vérifier l'import CSS
if ($config['ensure_css_extraction']) {
    $all_operations[] = check_css_import();
}

// 10. Assurer la présence de src/index.css
if ($config['ensure_css_extraction']) {
    $all_operations[] = ensure_src_index_css();
}

// Résumé des opérations
$success_count = 0;
$failure_count = 0;

foreach ($all_operations as $op) {
    if ($op['success']) {
        $success_count++;
    } else {
        $failure_count++;
    }
}

$status = $failure_count === 0 ? 'success' : ($success_count > 0 ? 'partial' : 'failure');
?>

<!DOCTYPE html>
<html>
<head>
    <title>Super Fix - Solution complète de déploiement</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root {
            --success-color: #10b981;
            --error-color: #ef4444;
            --warning-color: #f59e0b;
            --info-color: #3b82f6;
            --text-color: #1f2937;
            --bg-color: #f9fafb;
            --card-bg: #ffffff;
            --border-color: #e5e7eb;
        }
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        h1, h2, h3 {
            color: #1e3a8a;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
        }
        .card {
            background-color: var(--card-bg);
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            overflow: hidden;
        }
        .card-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-body {
            padding: 20px;
        }
        .success {
            color: var(--success-color);
            font-weight: bold;
        }
        .error {
            color: var(--error-color);
            font-weight: bold;
        }
        .warning {
            color: var(--warning-color);
            font-weight: bold;
        }
        .info {
            color: var(--info-color);
            font-weight: bold;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success {
            background-color: var(--success-color);
            color: white;
        }
        .badge-error {
            background-color: var(--error-color);
            color: white;
        }
        .badge-warning {
            background-color: var(--warning-color);
            color: white;
        }
        .operation-list {
            list-style: none;
            padding: 0;
        }
        .operation-item {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
        }
        .operation-item:last-child {
            border-bottom: none;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            margin-right: 8px;
            margin-top: 8px;
        }
        .button-success {
            background-color: var(--success-color);
        }
        .button-warning {
            background-color: var(--warning-color);
        }
        code {
            background-color: #f1f5f9;
            padding: 2px 4px;
            border-radius: 4px;
            font-family: monospace;
        }
        .files-list {
            background-color: #f1f5f9;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .summary-box {
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        .summary-box.success {
            background-color: rgba(16, 185, 129, 0.1);
            border: 1px solid var(--success-color);
        }
        .summary-box.error {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid var(--error-color);
        }
        .summary-box.warning {
            background-color: rgba(245, 158, 11, 0.1);
            border: 1px solid var(--warning-color);
        }
        .summary-icon {
            font-size: 2rem;
            margin-right: 16px;
        }
        .summary-content {
            flex: 1;
        }
        .steps {
            counter-reset: step;
            list-style: none;
            padding: 0;
        }
        .steps li {
            position: relative;
            padding-left: 40px;
            margin-bottom: 16px;
        }
        .steps li::before {
            counter-increment: step;
            content: counter(step);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background-color: #3b82f6;
            color: white;
            border-radius: 50%;
            position: absolute;
            left: 0;
            top: 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Super Fix - Solution complète de déploiement</h1>
        
        <div class="summary-box <?php echo $status === 'success' ? 'success' : ($status === 'partial' ? 'warning' : 'error'); ?>">
            <div class="summary-icon">
                <?php if ($status === 'success'): ?>✅<?php elseif($status === 'partial'): ?>⚠️<?php else: ?>❌<?php endif; ?>
            </div>
            <div class="summary-content">
                <h2 style="margin-top: 0;">Résumé des opérations</h2>
                <p>
                    <strong><?php echo $success_count; ?></strong> opérations réussies, 
                    <strong><?php echo $failure_count; ?></strong> opérations échouées
                </p>
                <p>
                    <?php if ($status === 'success'): ?>
                        <span class="success">Toutes les opérations de réparation ont réussi !</span>
                    <?php elseif ($status === 'partial'): ?>
                        <span class="warning">Certaines opérations ont réussi, mais d'autres ont échoué.</span>
                    <?php else: ?>
                        <span class="error">Aucune opération n'a réussi. Des problèmes importants subsistent.</span>
                    <?php endif; ?>
                </p>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h2 style="margin: 0;">Détails des opérations</h2>
            </div>
            <div class="card-body" style="padding: 0;">
                <ul class="operation-list">
                    <?php foreach ($all_operations as $op): ?>
                        <li class="operation-item">
                            <strong><?php echo htmlspecialchars($op['operation']); ?>:</strong>
                            <span class="<?php echo $op['success'] ? 'success' : 'error'; ?>">
                                <?php echo $op['success'] ? '✅ Réussi' : '❌ Échec'; ?>
                            </span>
                            <div><?php echo htmlspecialchars($op['message']); ?></div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h2 style="margin: 0;">Structure des fichiers</h2>
            </div>
            <div class="card-body">
                <h3>Répertoire assets:</h3>
                <div class="files-list">
<?php
$assets_files = is_dir('./assets') ? glob('./assets/*') : [];
echo $assets_files ? implode("\n", array_map('htmlspecialchars', $assets_files)) : 'Aucun fichier trouvé';
?>
                </div>
                
                <h3>Répertoire dist/assets:</h3>
                <div class="files-list">
<?php
$dist_assets_files = is_dir('./dist/assets') ? glob('./dist/assets/*') : [];
echo $dist_assets_files ? implode("\n", array_map('htmlspecialchars', $dist_assets_files)) : 'Aucun fichier trouvé';
?>
                </div>
                
                <h3>Fichiers importants:</h3>
                <ul>
                    <li>index.html: <?php echo file_exists('./index.html') ? '<span class="success">Existe</span> (' . filesize('./index.html') . ' octets)' : '<span class="error">N\'existe pas</span>'; ?></li>
                    <li>.htaccess: <?php echo file_exists('./.htaccess') ? '<span class="success">Existe</span> (' . filesize('./.htaccess') . ' octets)' : '<span class="error">N\'existe pas</span>'; ?></li>
                    <li>vite.config.js/ts: <?php echo file_exists('./vite.config.js') || file_exists('./vite.config.ts') ? '<span class="success">Existe</span>' : '<span class="error">N\'existe pas</span>'; ?></li>
                    <li>src/index.css: <?php echo file_exists('./src/index.css') ? '<span class="success">Existe</span> (' . filesize('./src/index.css') . ' octets)' : '<span class="error">N\'existe pas</span>'; ?></li>
                    <li>src/main.tsx: <?php echo file_exists('./src/main.tsx') ? '<span class="success">Existe</span> (' . filesize('./src/main.tsx') . ' octets)' : '<span class="error">N\'existe pas</span>'; ?></li>
                </ul>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h2 style="margin: 0;">Actions pour le build de production</h2>
            </div>
            <div class="card-body">
                <p>Les fichiers nécessaires ont été créés ou mis à jour pour permettre un build de production.</p>
                
                <div class="files-list">
# Installer les dépendances React (si nécessaire)
npm install react react-dom @vitejs/plugin-react-swc vite

# Installer le support TypeScript (si nécessaire)
npm install typescript @types/react @types/react-dom --save-dev

# Installer Tailwind CSS (si nécessaire)
npm install tailwindcss postcss autoprefixer --save-dev

# Effectuer le build
npm run build
</div>

                <p class="mt-4"><strong>Après le build:</strong></p>
                <ol class="steps">
                    <li>Vérifiez que le répertoire <code>dist</code> contient des fichiers <code>assets/index-*.css</code> et <code>assets/main-*.js</code></li>
                    <li>Copiez tout le contenu du répertoire <code>dist</code> à la racine de votre site</li>
                    <li>Assurez-vous que <code>.htaccess</code> est également présent à la racine</li>
                </ol>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h2 style="margin: 0;">Récupération sans build local</h2>
            </div>
            <div class="card-body">
                <p>Si vous ne pouvez pas effectuer un build local, ce script a créé une structure minimale qui devrait permettre à votre application de fonctionner en mode développement.</p>
                
                <ol class="steps">
                    <li>
                        <strong>Vérifiez index.html</strong> pour vous assurer qu'il pointe vers <code>/assets/index.css</code> et <code>/src/main.tsx</code> ou <code>/assets/index.js</code>
                    </li>
                    <li>
                        <strong>Testez l'application</strong> en y accédant via votre navigateur. Vous devriez voir au moins une page minimale.
                    </li>
                    <li>
                        <strong>Si la page n'apparaît pas</strong>, vérifiez que les fichiers CSS et JS sont correctement chargés dans les outils de développement du navigateur.
                    </li>
                </ol>
                
                <p class="warning"><strong>Important:</strong> Cette solution est temporaire. Pour une application de production, un build complet est recommandé.</p>
            </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <a href="/" class="button">Retour à l'application</a>
            <a href="?refresh=1" class="button button-success">Relancer la correction</a>
            <a href="run-deploy.php" class="button button-warning">Exécuter le déploiement complet</a>
        </div>
    </div>
</body>
</html>
