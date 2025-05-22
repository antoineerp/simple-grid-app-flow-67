
<?php
header('Content-Type: text/html; charset=utf-8');

// Préparation du déploiement
function prepare_deploy() {
    // Vérifier si le script existe, sinon le créer
    if (!file_exists('./deploy.sh')) {
        $deploy_script = <<<EOT
#!/bin/bash
# Script de déploiement automatique

echo "====== Démarrage du déploiement ======"

# Création des répertoires nécessaires
mkdir -p dist/assets

# Copier les fichiers nécessaires
echo "Copie des fichiers CSS et JS vers dist/assets..."
cp -f assets/index.css dist/assets/
cp -f assets/index.js dist/assets/main.js

# Copier index.html dans dist
echo "Copie de index.html vers dist..."
cp -f index.html dist/

# Copier .htaccess dans dist
if [ -f ".htaccess" ]; then
    echo "Copie de .htaccess vers dist..."
    cp -f .htaccess dist/
else
    echo "ATTENTION: .htaccess non trouvé"
fi

echo "====== Vérification des fichiers créés ======"
ls -la dist/assets/

echo "====== Déploiement terminé ======"
echo "Accédez maintenant à votre site pour vérifier le déploiement."
EOT;
        
        file_put_contents('./deploy.sh', $deploy_script);
        chmod('./deploy.sh', 0755);
    }
    
    // Exécuter le script
    $output = "";
    if (function_exists('exec')) {
        exec('bash ./deploy.sh 2>&1', $output_array, $return_var);
        $output = implode("\n", $output_array);
    } else {
        $output = "La fonction exec() n'est pas disponible sur ce serveur. Le script n'a pas pu être exécuté automatiquement.";
    }
    
    return $output;
}

// Exécuter le déploiement
$result = prepare_deploy();
?>

<!DOCTYPE html>
<html>
<head>
    <title>Déploiement de l'Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .output { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; overflow-x: auto; white-space: pre-wrap; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .actions { margin-top: 20px; padding: 10px; background: #eef2f7; border-radius: 5px; }
        .button { display: inline-block; padding: 8px 15px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Déploiement de l'Application</h1>
        
        <div>
            <h2>Résultat du déploiement</h2>
            <div class="output"><?php echo htmlspecialchars($result); ?></div>
        </div>
        
        <?php
        // Vérifier si dist/assets contient des fichiers
        $has_assets = false;
        if (is_dir('./dist/assets')) {
            $files = glob('./dist/assets/*');
            $has_assets = !empty($files);
        }
        ?>
        
        <div class="actions">
            <h3>État du déploiement</h3>
            <?php if ($has_assets): ?>
                <p class="success">Des fichiers ont été déployés dans le répertoire dist/assets.</p>
            <?php else: ?>
                <p class="warning">Le répertoire dist/assets semble vide ou n'existe pas.</p>
            <?php endif; ?>
            
            <h3>Actions supplémentaires</h3>
            <p>Après le déploiement, vous pouvez vérifier et corriger les références d'assets:</p>
            
            <a href="super-fix-deploy.php" class="button">Vérifier et corriger la configuration</a>
            <a href="/" class="button">Accéder à l'application</a>
            
            <?php if (is_dir('./dist')): ?>
                <a href="/dist/" class="button">Voir la version déployée</a>
            <?php endif; ?>
        </div>
        
        <div class="actions" style="margin-top: 20px;">
            <h3>Commandes pour build local</h3>
            <div class="output">
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Construction pour production
npm run build

# Prévisualisation de la version de production
npm run preview</div>
        </div>
    </div>
</body>
</html>
