
<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solution de déploiement FormaCert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; }
        .error { color: red; }
        .code { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: monospace; }
        .btn { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Solution pour le déploiement de FormaCert</h1>
        
        <div class="card">
            <h2>Problème: Fichiers CSS manquants dans dist/</h2>
            <p>Lorsque vous recevez l'erreur <code>Aucun fichier CSS principal (index.*.css ou main.*.css) trouvé dans dist</code>, cela signifie que le processus de build ne génère pas correctement les fichiers CSS ou qu'ils ne sont pas correctement transférés vers le serveur.</p>
            
            <h3>Solution 1: Générer manuellement le build et vérifier</h3>
            <div class="code">
                # Exécuter localement
                npm run build
                
                # Vérifier le contenu du dossier dist/assets
                ls -la dist/assets
                
                # S'assurer qu'il y a des fichiers .css générés
            </div>
            
            <h3>Solution 2: Configurer correctement le GitHub Workflow</h3>
            <p>Votre workflow GitHub doit:</p>
            <ol>
                <li>Installer les dépendances (<code>npm install</code>)</li>
                <li>Générer le build (<code>npm run build</code>)</li>
                <li>Transférer explicitement le dossier dist/ vers votre serveur</li>
                <li>Ne pas filtrer les fichiers CSS lors du transfert</li>
            </ol>
            
            <p>Exemple de configuration workflow:</p>
            <div class="code">
name: Deploy to Infomaniak

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install Dependencies
      run: npm install --legacy-peer-deps
      
    - name: Build React App
      run: npm run build
      
    - name: Debug build output
      run: |
        echo "Contenu du dossier dist:"
        ls -la dist/
        echo "Contenu du dossier dist/assets:"
        ls -la dist/assets/
        
    # IMPORTANT: Cette étape assure que le dossier dist est explicitement inclus
    - name: Prepare deployment directory
      run: |
        mkdir -p deploy/dist
        cp -r dist/* deploy/dist/
        
    - name: FTP Deploy to Infomaniak
      uses: SamKirkland/FTP-Deploy-Action@v4.3.4
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./deploy/
        server-dir: /sites/qualiopi.ch/
        dangerous-clean-slate: false
</div>
        </div>
        
        <div class="card">
            <h2>Solution rapide pour les deux problèmes</h2>
            <p>Pour résoudre à la fois le problème du menu administrateur et des fichiers CSS manquants:</p>
            
            <ol>
                <li>Assurez-vous que le workflow GitHub est correctement configuré (voir ci-dessus)</li>
                <li>Vérifiez que les routes administrateur sont correctement définies dans <code>App.tsx</code></li>
                <li>Vérifiez que le composant <code>Sidebar</code> inclut les liens vers les pages d'administration</li>
                <li>Utilisez les outils de diagnostic fournis pour identifier les problèmes spécifiques</li>
            </ol>
            
            <p>Utilisez les outils suivants pour diagnostiquer et corriger les problèmes:</p>
            <a href="test-assets-routes.php" class="btn">Diagnostiquer les problèmes</a>
            <a href="fix-index-html.php" class="btn">Corriger index.html</a>
            <a href="copy-assets.php" class="btn">Copier les assets</a>
        </div>
        
        <div class="card">
            <h2>Note importante</h2>
            <p>Après avoir mis en place les solutions ci-dessus:</p>
            <ol>
                <li>Lancez un déploiement manuel depuis GitHub pour vous assurer que tout est correctement configuré</li>
                <li>Si les problèmes persistent, utilisez les scripts de diagnostic pour identifier les erreurs spécifiques</li>
                <li>Vérifiez les logs du workflow GitHub pour voir si le build et le FTP fonctionnent correctement</li>
                <li>En dernier recours, vous pouvez utiliser les scripts PHP fournis pour corriger manuellement les problèmes</li>
            </ol>
        </div>
        
        <p><a href="index.html" class="btn">Retour à l'application</a></p>
    </div>
</body>
</html>
