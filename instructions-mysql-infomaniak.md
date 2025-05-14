
# Instructions pour accéder à la base de données MySQL sur Infomaniak

## Option 1: Via phpMyAdmin (recommandée)

1. Connectez-vous à votre compte Infomaniak
2. Accédez à l'espace "Hébergement Web"
3. Sélectionnez votre site (qualiopi.ch)
4. Dans le menu, cliquez sur "Bases de données MySQL"
5. Trouvez votre base de données dans la liste (probablement p71x6d_richard)
6. Cliquez sur l'icône phpMyAdmin à côté de la base de données
7. Connectez-vous avec les informations suivantes:
   - Utilisateur: p71x6d_richard
   - Mot de passe: Trottinette43!
8. Une fois connecté, cliquez sur l'onglet "SQL" en haut
9. Copiez-collez le contenu du fichier `diagnostics-infomaniak.sql`
10. Cliquez sur "Exécuter" pour exécuter les requêtes

## Option 2: Via MySQL Workbench ou autre client MySQL

1. Ouvrez MySQL Workbench ou votre client MySQL préféré
2. Créez une nouvelle connexion avec les paramètres suivants:
   - Nom de la connexion: Infomaniak-Qualiopi
   - Méthode de connexion: Standard TCP/IP
   - Hôte: p71x6d.myd.infomaniak.com
   - Port: 3306
   - Utilisateur: p71x6d_richard
   - Mot de passe: Trottinette43!
   - Base de données par défaut: p71x6d_richard
3. Testez la connexion
4. Si la connexion est réussie, ouvrez un nouvel éditeur SQL
5. Copiez-collez le contenu du fichier `diagnostics-infomaniak.sql`
6. Exécutez les requêtes

## Résolution des problèmes courants

### Erreur d'accès refusé
Si vous obtenez une erreur "Access denied", vérifiez que:
- Le nom d'utilisateur et mot de passe sont corrects
- L'utilisateur a les droits d'accès à la base de données
- Votre adresse IP est autorisée (vérifiez les restrictions d'accès dans le panneau Infomaniak)

### Impossible de se connecter au serveur
Si vous ne pouvez pas vous connecter au serveur:
- Vérifiez que l'hôte est correct (p71x6d.myd.infomaniak.com)
- Vérifiez que le port 3306 est ouvert et accessible
- Contactez le support Infomaniak pour confirmer que les connexions externes sont autorisées

## Vérifications à faire

Après avoir exécuté le script SQL:
1. Vérifiez que la version de MySQL est affichée
2. Confirmez que vous êtes connecté à la bonne base de données (p71x6d_richard)
3. Vérifiez la liste des tables pour confirmer que la structure de la base de données est correcte
4. Vérifiez que la table de diagnostic a été créée avec succès
