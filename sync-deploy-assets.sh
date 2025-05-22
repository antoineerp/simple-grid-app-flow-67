
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

# Compter le nombre de fichiers copiés
FILE_COUNT=$(find deploy/assets -type f | wc -l)
echo "Nombre de fichiers dans deploy/assets: $FILE_COUNT"

# Vérification supplémentaire
if [ $FILE_COUNT -eq 0 ]; then
    echo "AVERTISSEMENT: Aucun fichier n'a été copié dans deploy/assets."
    echo "Vérifiez que les assets sont bien générés dans dist/assets."
else
    echo "Synchronisation réussie: $FILE_COUNT fichiers synchronisés."
    echo "Les fichiers sont prêts pour le déploiement."
fi

echo "====== Fin de la synchronisation ======"
