
# Déploiement GitHub Actions vers Infomaniak

Ce workflow automatise le déploiement de l'application FormaCert vers l'hébergement Infomaniak via FTP.

## Configuration requise

1. Ajoutez les secrets suivants dans les paramètres de votre dépôt GitHub:
   - `FTP_SERVER`: l'adresse du serveur FTP d'Infomaniak (exemple: ftp.infomaniak.com)
   - `FTP_USERNAME`: votre nom d'utilisateur FTP
   - `FTP_PASSWORD`: votre mot de passe FTP

2. Vérifiez que le serveur FTP permet les connexions externes et que les identifiants sont corrects.

## Structure du workflow

Le workflow effectue les actions suivantes:
1. Récupération du code source
2. Configuration de Node.js
3. Installation des dépendances
4. Construction de l'application
5. Copie des fichiers essentiels (.htaccess, etc.)
6. Déploiement vers Infomaniak via FTP

## Dossier de destination

Le workflow peut être configuré pour déployer dans différents dossiers/sous-domaines :
- Pour déployer à la racine : utilisez `server-dir: /`
- Pour déployer sur un sous-domaine : utilisez `server-dir: /test.qualiopi.ch/`

Choisissez le dossier de destination en modifiant la valeur de `server-dir` dans le fichier `deploy.yml`.

## Résolution des problèmes

Si le déploiement échoue:
1. Vérifiez les logs dans l'onglet "Actions" de GitHub
2. Assurez-vous que les secrets sont correctement configurés
3. Vérifiez le format du serveur FTP (exemple: ftp.infomaniak.com)
4. Assurez-vous que les permissions FTP sont correctes
5. Pour Infomaniak spécifiquement:
   - Vérifiez que l'utilisateur FTP a les droits d'écriture sur le dossier cible
   - Confirmez que le chemin FTP correspond bien à la racine du site web (`/` ou un sous-dossier)
   - Testez la connexion FTP manuellement avec FileZilla ou un autre client FTP

6. Après un déploiement, téléchargez et utilisez le script `deploy-check.php` pour diagnostiquer l'état du déploiement
