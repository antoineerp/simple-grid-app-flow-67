
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Régénération des Assets</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .section { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .fix-button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        .code-block { background-color: #f4f4f4; padding: 10px; border-left: 3px solid #666; margin: 10px 0; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Régénération des Assets</h1>
    
    <div class="section">
        <h2>Diagnostic du problème d'assets</h2>
        <p>Vous rencontrez un problème avec les fichiers JavaScript principaux manquants. Ce problème peut être résolu en suivant les étapes ci-dessous.</p>
        
        <h3>Causes possibles</h3>
        <ol>
            <li>Le build a échoué ou n'a pas généré les fichiers JavaScript correctement.</li>
            <li>Les fichiers JavaScript ont été générés mais n'ont pas été copiés au bon endroit lors du déploiement.</li>
            <li>Les références dans index.html sont incorrectes et ne pointent pas vers les bons fichiers.</li>
            <li>La configuration de Vite pour le build de production n'est pas correcte.</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Solution en 3 étapes</h2>
        
        <h3>Étape 1: Vérifier et corriger la configuration de Vite</h3>
        <p>Assurez-vous que votre configuration Vite est correcte dans <code>vite.config.js</code> ou <code>vite.config.ts</code>:</p>
        <div class="code-block">
            build: {<br>
            &nbsp;&nbsp;outDir: 'dist',<br>
            &nbsp;&nbsp;assetsDir: 'assets',<br>
            &nbsp;&nbsp;// Autres options de build...<br>
            }
        </div>
        
        <h3>Étape 2: Régénérer le build</h3>
        <p>Exécutez ces commandes pour vous assurer que le build est propre:</p>
        <div class="code-block">
            npm cache clean --force<br>
            rm -rf node_modules/.cache<br>
            rm -rf dist<br>
            npm install<br>
            npm run build
        </div>
        <p>Après le build, vérifiez le contenu du dossier <code>dist/assets</code> pour confirmer que les fichiers JavaScript ont été générés.</p>
        
        <h3>Étape 3: Déployer correctement les fichiers</h3>
        <p>Utilisez notre outil automatique pour copier les assets et corriger index.html:</p>
        <p><a href="copy-assets.php" class="fix-button">Utiliser l'outil de copie d'assets</a></p>
        <p>Cet outil va:</p>
        <ul>
            <li>Copier tous les fichiers JS/CSS depuis <code>dist/assets</code> vers <code>assets</code> à la racine</li>
            <li>Mettre à jour <code>index.html</code> pour référencer correctement ces fichiers</li>
            <li>Vous montrer un rapport détaillé des changements effectués</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Vérification après correction</h2>
        <p>Une fois les étapes ci-dessus terminées, utilisez ces outils pour confirmer que tout est correct:</p>
        <p>
            <a href="verify-deploy.php" class="fix-button">Vérifier le déploiement</a>
            <a href="check-assets-deployment.php" style="margin-left: 10px;" class="fix-button">Diagnostic complet</a>
        </p>
    </div>
    
    <div class="section">
        <h2>Configuration manuelle de GitHub Actions</h2>
        <p>Si vous utilisez GitHub Actions pour le déploiement, assurez-vous que le workflow est configuré pour:</p>
        <ol>
            <li>Générer correctement le build avec <code>npm run build</code></li>
            <li>Copier les fichiers du dossier <code>dist/assets</code> vers <code>assets</code> à la racine du site</li>
            <li>Copier <code>index.html</code> et <code>.htaccess</code> correctement</li>
        </ol>
        <p>Exemple de commande pour préparer le déploiement:</p>
        <div class="code-block">
            # Créer le dossier de déploiement<br>
            mkdir -p deploy/assets<br>
            <br>
            # Copier index.html et .htaccess<br>
            cp dist/index.html deploy/<br>
            cp .htaccess deploy/<br>
            <br>
            # Copier les assets<br>
            cp -r dist/assets/* deploy/assets/<br>
        </div>
    </div>
</body>
</html>
