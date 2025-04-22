
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

Le workflow est actuellement configuré pour déployer dans le dossier `/qualiopi.ch/` sur le serveur FTP. Si vous avez besoin de changer ce dossier, modifiez la valeur de `server-dir` dans le fichier `deploy.yml`.

## Résolution des problèmes

Si le déploiement échoue:
1. Vérifiez les logs dans l'onglet "Actions" de GitHub
2. Assurez-vous que les secrets sont correctement configurés
3. Vérifiez le format du serveur FTP (exemple: ftp.infomaniak.com)
4. Assurez-vous que le chemin du répertoire sur le serveur est correct
5. Vérifiez les permissions FTP sur le serveur Infomaniak
