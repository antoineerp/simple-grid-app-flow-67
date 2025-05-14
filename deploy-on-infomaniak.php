
<?php
header('Content-Type: text/html; charset=utf-8');
// Fonction pour vérifier que les secrets GitHub sont configurés
function checkGitHubSecrets() {
    $owner = 'antoineerp';
    $repo = 'simple-grid-app-flow-67';
    
    $secretsConfigured = false;
    $secretsMessage = "Impossible de vérifier les secrets GitHub";
    
    return [
        'configured' => $secretsConfigured,
        'message' => $secretsMessage
    ];
}

// Obtenir le statut actuel des secrets
$secretsStatus = checkGitHubSecrets();
?>
<!DOCTYPE html>
<html>
<head>
    <title>Déploiement Manuel sur Infomaniak</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { 
            background-color: #4CAF50; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 16px; 
            text-decoration: none;
            display: inline-block;
        }
        .button:hover { background-color: #45a049; }
        .button.secondary {
            background-color: #6c757d;
        }
        .button.secondary:hover {
            background-color: #5a6268;
        }
        .info { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #17a2b8; margin: 10px 0; }
        .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0; }
        .success { color: green; }
        .error { color: red; }
        .steps { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
        .steps ol { margin-left: 20px; padding-left: 0; }
        .steps li { margin-bottom: 10px; }
        img.screenshot { max-width: 100%; border: 1px solid #ddd; margin: 10px 0; border-radius: 4px; }
        .highlight { background-color: #ffffcc; padding: 2px 5px; border-radius: 3px; }
        .note { font-style: italic; color: #666; margin-top: 5px; }
        .troubleshooting { background-color: #f1f1f1; padding: 15px; border-radius: 4px; margin-top: 20px; border-left: 4px solid #ff5722; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Déploiement Manuel sur Infomaniak</h1>
        
        <div class="card">
            <h2>Comment trouver le bouton "Run workflow"</h2>
            
            <div class="steps">
                <h3>1. Accès au workflow</h3>
                <ol>
                    <li>Connectez-vous à votre compte GitHub</li>
                    <li>Accédez au dépôt <a href="https://github.com/antoineerp/simple-grid-app-flow-67" target="_blank">simple-grid-app-flow-67</a></li>
                    <li>Cliquez sur l'onglet <strong>Actions</strong> en haut de la page</li>
                    <li>Sur la page Actions, cliquez sur <strong>"Deploy to Infomaniak"</strong> dans la liste des workflows à gauche</li>
                </ol>
                <div class="note">Si vous ne voyez pas le workflow, assurez-vous d'être dans la branche principale (main).</div>
            </div>
            
            <div class="steps">
                <h3>2. Utilisation du bouton "Run workflow"</h3>
                <ol>
                    <li>Une fois sur la page du workflow, cherchez le bouton <span class="highlight">"Run workflow"</span> qui devrait être visible en haut à droite</li>
                    <li>Si le bouton n'est pas visible, vérifiez que :
                        <ul>
                            <li>Vous avez les permissions nécessaires (être propriétaire ou collaborateur avec droits d'écriture)</li>
                            <li>Le workflow est configuré avec <code>workflow_dispatch</code> (déjà configuré)</li>
                            <li>Vous avez actualisé la page (F5)</li>
                        </ul>
                    </li>
                </ol>
            </div>
            
            <div class="troubleshooting">
                <h3>Résolution des problèmes courants</h3>
                <ul>
                    <li><strong>Bouton non visible</strong> - Essayez d'utiliser un autre navigateur ou de vider le cache</li>
                    <li><strong>Erreur d'autorisation</strong> - Vérifiez vos droits sur le dépôt</li>
                    <li><strong>Workflow non listé</strong> - Vérifiez que le fichier .github/workflows/deploy.yml existe bien</li>
                </ul>
                <p>Vous pouvez également déclencher un déploiement en poussant une modification sur la branche main :</p>
                <pre>git commit --allow-empty -m "Force deployment"
git push origin main</pre>
            </div>
        </div>
        
        <div class="card">
            <h2>Checklist Complète de Déploiement</h2>
            
            <div class="steps">
                <h3>1. Préparation Locale</h3>
                <pre><code>
# Vérification de la branche
git checkout main

# Mise à jour du dépôt
git pull origin main

# Installation des dépendances
npm install

# Nettoyage du cache
npm cache clean --force
rm -rf node_modules/.cache

# Construction du projet
npm run build
                </code></pre>
            </div>

            <div class="steps">
                <h3>2. Vérification du Build (Important)</h3>
                <ol>
                    <li>Vérifiez le dossier <code>dist/</code> :
                        <ul>
                            <li>✓ index.html</li>
                            <li>✓ .htaccess</li>
                            <li>✓ dossier assets/ avec les fichiers JS/CSS</li>
                            <li>✓ dossier api/ avec tous les sous-dossiers :
                                <ul>
                                    <li>config/</li>
                                    <li>controllers/</li>
                                    <li>middleware/</li>
                                    <li>models/</li>
                                    <li>utils/</li>
                                </ul>
                            </li>
                            <li>✓ dossier public/ avec lovable-uploads/</li>
                        </ul>
                    </li>
                    <li>Vérifiez la présence des fichiers critiques dans api/ :
                        <ul>
                            <li>.htaccess</li>
                            <li>.user.ini</li>
                            <li>index.php</li>
                            <li>auth.php</li>
                            <li>test.php</li>
                        </ul>
                    </li>
                </ol>
            </div>

            <div class="steps">
                <h3>3. Commandes de Validation</h3>
                <pre><code>
# Vérification des fichiers modifiés
git status

# Si tout est correct, commit des changements
git add .
git commit -m "Build de production - Déploiement complet"
git push origin main
                </code></pre>
            </div>

            <div class="steps">
                <h3>4. Déclenchement du Workflow GitHub</h3>
                <?php
                $owner = 'antoineerp';
                $repo = 'simple-grid-app-flow-67';
                $workflow_id = 'deploy.yml';
                $github_actions_url = "https://github.com/$owner/$repo/actions/workflows/$workflow_id";
                echo "<p><a href='$github_actions_url' target='_blank' class='button'>Lancer le Workflow GitHub</a></p>";
                ?>
            </div>

            <div class="steps">
                <h3>5. Vérification Post-Déploiement</h3>
                <ol>
                    <li>Attendez la fin du workflow GitHub (~5 minutes)</li>
                    <li>Utilisez les outils de diagnostic :
                        <p>
                            <a href="deploy-check.php" target="_blank" class="button">Diagnostic Complet</a>
                            <a href="verify-deploy.php" target="_blank" class="button secondary">Vérification Alternative</a>
                        </p>
                    </li>
                    <li>Vérifiez les points suivants sur le site :
                        <ul>
                            <li>Chargement de la page d'accueil</li>
                            <li>Connexion à l'application</li>
                            <li>Accès à l'API</li>
                            <li>Chargement des assets</li>
                            <li>Fonctionnement du routing</li>
                        </ul>
                    </li>
                </ol>
            </div>
        </div>

        <div class="card">
            <h2>Autres options de déploiement</h2>
            <p>Si le bouton "Run workflow" n'est toujours pas visible, vous pouvez essayer ces alternatives :</p>
            
            <div class="steps">
                <h3>Option 1: Utiliser l'API GitHub</h3>
                <p>Créez un token d'accès personnel sur GitHub et utilisez cette commande cURL :</p>
                <pre>curl -X POST \
-H "Accept: application/vnd.github.v3+json" \
-H "Authorization: token YOUR_PERSONAL_TOKEN" \
https://api.github.com/repos/antoineerp/simple-grid-app-flow-67/actions/workflows/deploy.yml/dispatches \
-d '{"ref":"main"}'</pre>
            </div>
            
            <div class="steps">
                <h3>Option 2: Commit vide</h3>
                <p>Un commit vide déclenchera aussi le workflow :</p>
                <pre>git commit --allow-empty -m "Force deployment"
git push origin main</pre>
            </div>
        </div>

        <div class="card">
            <h2>Instructions pour Déployer</h2>
            <p>Cette page vous guide pour déclencher manuellement un déploiement via GitHub Actions vers Infomaniak.</p>
            
            <div class="info">
                <p><strong>Note:</strong> Pour que ce déploiement fonctionne, les secrets GitHub suivants doivent être configurés :</p>
                <ul>
                    <li>FTP_SERVER - Serveur FTP d'Infomaniak</li>
                    <li>FTP_USERNAME - Nom d'utilisateur FTP</li>
                    <li>FTP_PASSWORD - Mot de passe FTP</li>
                </ul>
            </div>
        </div>

        <div class="card">
            <h2>Processus de Déploiement en 3 Étapes</h2>
            
            <div class="steps">
                <h3>Étape 1: Aller à la page Actions de GitHub</h3>
                <p>Cliquez sur le bouton ci-dessous pour ouvrir directement la page des Actions GitHub :</p>
                <?php
                // URL de l'API GitHub pour déclencher le workflow
                $owner = 'antoineerp';  // Remplacez par le propriétaire du dépôt
                $repo = 'simple-grid-app-flow-67';  // Remplacez par le nom du dépôt
                $workflow_id = 'deploy.yml';  // ID du workflow à déclencher
                
                $github_actions_url = "https://github.com/$owner/$repo/actions/workflows/$workflow_id";
                
                echo "<p><a href='$github_actions_url' target='_blank' class='button'>Ouvrir GitHub Actions</a></p>";
                ?>
            </div>
            
            <div class="steps">
                <h3>Étape 2: Lancer le workflow</h3>
                <ol>
                    <li>Sur la page GitHub Actions, cliquez sur le bouton <span class="highlight">"Run workflow"</span> à droite <strong>(IMPORTANT!)</strong></li>
                    <li>Assurez-vous que la branche <span class="highlight">"main"</span> est sélectionnée</li>
                    <li>Cliquez sur le bouton <span class="highlight">"Run workflow"</span> vert pour démarrer le déploiement</li>
                </ol>
                <div class="warning">
                    <p><strong>Attention!</strong> Vous devez explicitement cliquer sur le bouton "Run workflow" sur la page GitHub. L'ouverture de la page ne déclenche pas automatiquement le déploiement.</p>
                </div>
            </div>
            
            <div class="steps">
                <h3>Étape 3: Vérifier le déploiement</h3>
                <ol>
                    <li>Attendez que le workflow se termine (généralement 2-5 minutes)</li>
                    <li>Une fois terminé, vérifiez que le statut est <span class="success">vert</span> (succès)</li>
                    <li>Utilisez l'outil de diagnostic ci-dessous pour confirmer que le déploiement est correct</li>
                </ol>
            </div>
        </div>
        
        <div class="card">
            <h2>Suivi et Vérification</h2>
            <?php
            $actions_url = "https://github.com/$owner/$repo/actions";
            echo "<p>Vous pouvez suivre l'état des déploiements sur la <a href='$actions_url' target='_blank'>page Actions de GitHub</a>.</p>";
            ?>
            
            <p>Une fois le déploiement terminé, vérifiez votre site à l'adresse :</p>
            <p><a href="https://qualiopi.ch/" target="_blank" class="button">Visiter le site</a></p>
            
            <h3>Diagnostic du Déploiement</h3>
            <p>Pour vérifier que votre déploiement a réussi, utilisez notre outil de diagnostic :</p>
            <p>
                <a href="deploy-check.php" target="_blank" class="button">Vérifier le déploiement</a>
                <a href="verify-deploy.php" target="_blank" class="button secondary">Vérification alternative</a>
            </p>
            
            <h3>Problèmes de déploiement fréquents</h3>
            <ul>
                <li><strong>Erreur 500</strong> - Vérifiez les logs d'erreur Apache et l'accès aux fichiers</li>
                <li><strong>Redirections infinies</strong> - Problème probable avec les règles .htaccess</li>
                <li><strong>Fichiers manquants</strong> - Vérifiez la structure du build dans GitHub Actions</li>
                <li><strong>Page blanche</strong> - Vérifiez les erreurs JavaScript dans la console du navigateur</li>
            </ul>
        </div>
    </div>
</body>
</html>
