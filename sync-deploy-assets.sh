
#!/bin/bash
# Script de synchronisation des assets pour le déploiement

echo "====== Synchronisation des assets pour le déploiement ======"

# Vérifier si le build existe
if [ ! -d "dist" ] || [ ! -d "dist/assets" ]; then
    echo "Erreur: Le dossier dist/assets n'existe pas."
    echo "Exécutez d'abord 'npm run build' pour générer les assets."
    exit 1
fi

# Créer le répertoire de déploiement s'il n'existe pas
echo "Création des répertoires de déploiement..."
mkdir -p deploy/assets

# Copier les assets
echo "Copie des assets compilés..."
cp -r dist/assets/* deploy/assets/

# Lister les fichiers copiés
echo "Fichiers copiés dans deploy/assets:"
ls -la deploy/assets/

# Compter le nombre de fichiers copiés
FILE_COUNT=$(find deploy/assets -type f | wc -l)
echo "Nombre de fichiers dans deploy/assets: $FILE_COUNT"

# Identifier les fichiers JS et CSS principaux
JS_FILES=$(find deploy/assets -name "*.js" | sort)
CSS_FILES=$(find deploy/assets -name "*.css" | sort)

echo "Fichiers JavaScript trouvés:"
echo "$JS_FILES"

echo "Fichiers CSS trouvés:"
echo "$CSS_FILES"

# Vérification supplémentaire
if [ $FILE_COUNT -eq 0 ]; then
    echo "AVERTISSEMENT: Aucun fichier n'a été copié dans deploy/assets."
    echo "Vérifiez que les assets sont bien générés dans dist/assets."
else
    echo "Synchronisation réussie: $FILE_COUNT fichiers synchronisés."
    echo "Les fichiers sont prêts pour le déploiement."
    
    # Mise à jour du index.html si nécessaire
    if [ -f "deploy/index.html" ]; then
        echo "Vérification des références dans index.html..."
        
        # À ce stade, vous pourriez utiliser un script PHP pour mettre à jour index.html
        echo "Pour mettre à jour index.html, utilisez le script update-assets.php"
    fi
fi

echo "====== Fin de la synchronisation ======"
