
# Instructions pour accéder à la base de données MySQL sur Infomaniak

## Option 1: Via phpMyAdmin (recommandée)

1. Connectez-vous à votre compte Infomaniak
2. Accédez à l'espace "Hébergement Web"
3. Sélectionnez votre site (qualiopi.ch)
4. Dans le menu, cliquez sur "Bases de données MySQL"
5. Trouvez votre base de données dans la liste (p71x6d_richard)
6. Cliquez sur l'icône phpMyAdmin à côté de la base de données
7. Connectez-vous avec les informations suivantes:
   - Utilisateur: p71x6d_richard
   - Mot de passe: Trottinette43!
8. Une fois connecté, cliquez sur l'onglet "SQL" en haut
9. Copiez-collez le contenu du fichier `diagnostics-infomaniak.sql`
10. Cliquez sur "Exécuter" pour exécuter les requêtes

## Option 2: Via SSH et MySQL Client

1. Connectez-vous à votre serveur via SSH
   ```
   ssh df8dceff557ccc0605d45e1581aa661b@ssh-df8dceff557ccc0605d45e1581aa661b.infomaniak.ch
   ```
   
2. Une fois connecté, rendez le script de diagnostic exécutable:
   ```
   chmod +x diagnose-infomaniak.sh
   ```
   
3. Exécutez le script de diagnostic:
   ```
   ./diagnose-infomaniak.sh
   ```

## Résolution du problème de MIME type CSS

Si les fichiers CSS sont servis avec le mauvais type MIME (text/html au lieu de text/css), ajoutez ou modifiez le fichier `.htaccess` dans le dossier `assets/` avec le contenu suivant:

```
# Définir les types MIME corrects
<IfModule mod_mime.c>
    AddType text/css .css
    AddType application/javascript .js
</IfModule>

# Forcer le type MIME pour les fichiers CSS
<FilesMatch "\.css$">
    ForceType text/css
</FilesMatch>

# Désactiver tout filtrage de type pour les fichiers statiques
<IfModule mod_filter.c>
    FilterDeclare COMPRESS
    <FilesMatch "\.(css|js)$">
        FilterProvider COMPRESS DEFLATE "%{CONTENT_TYPE} = 'text/css' or %{CONTENT_TYPE} = 'application/javascript'"
        FilterChain COMPRESS
    </FilesMatch>
</IfModule>
```

Pour ajouter ce fichier via SSH:
```
echo '# Définir les types MIME corrects
<IfModule mod_mime.c>
    AddType text/css .css
    AddType application/javascript .js
</IfModule>

# Forcer le type MIME pour les fichiers CSS
<FilesMatch "\.css$">
    ForceType text/css
</FilesMatch>' > /home/clients/df8dceff557ccc0605d45e1581aa661b/sites/qualiopi.ch/assets/.htaccess
```

## Vérifications à faire après correction

1. Confirmez que la base de données contient les tables nécessaires
2. Vérifiez que les fichiers CSS sont correctement servis avec le type MIME `text/css`
3. Testez l'application pour vous assurer qu'elle fonctionne comme prévu
