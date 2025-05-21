
#!/bin/bash
# Script de déploiement manuel pour les environnements sans GitHub Actions

echo "====== Démarrage du déploiement manuel ======"

# Vérifier si les outils nécessaires sont installés
command -v npm >/dev/null 2>&1 || { echo "npm est requis mais n'est pas installé. Aborting."; exit 1; }

# Construire l'application
echo "Construction de l'application..."
npm run build

# Vérifier si la construction a réussi
if [ $? -ne 0 ]; then
    echo "Erreur lors de la construction. Déploiement annulé."
    exit 1
fi

echo "Construction réussie."

# Créer la structure du répertoire de déploiement
echo "Préparation du répertoire de déploiement..."
mkdir -p deploy/assets
mkdir -p deploy/api
mkdir -p deploy/api/config
mkdir -p deploy/api/services
mkdir -p deploy/api/controllers
mkdir -p deploy/api/models
mkdir -p deploy/api/models/traits
mkdir -p deploy/api/middleware
mkdir -p deploy/api/operations
mkdir -p deploy/api/utils
mkdir -p deploy/public/lovable-uploads
mkdir -p deploy/dist

# Copier les fichiers compilés
echo "Copie des fichiers compilés..."
cp -r dist/ deploy/dist/
cp -r dist/assets/* deploy/assets/
cp dist/index.html deploy/
cp .htaccess deploy/ || echo "Fichier .htaccess non trouvé"

# Copier les scripts d'aide
echo "Copie des scripts d'aide..."
cp update-assets.php deploy/
cp fix-assets.php deploy/ || echo "fix-assets.php non trouvé"
cp fix-index-references.php deploy/ || echo "fix-index-references.php non trouvé"
cp fix-missing-references.php deploy/ || echo "fix-missing-references.php non trouvé"

# Copier les fichiers de l'API si existants
if [ -d "api" ]; then
    echo "Copie des fichiers API..."
    cp -r api/* deploy/api/
else
    echo "Dossier API non trouvé"
fi

# Copier les uploads si existants
if [ -d "public/lovable-uploads" ]; then
    echo "Copie des uploads..."
    cp -r public/lovable-uploads/* deploy/public/lovable-uploads/ || echo "Copie des uploads échouée"
else
    echo "Dossier uploads non trouvé"
fi

# Exécuter la mise à jour des références d'assets
echo "Mise à jour des références d'assets dans index.html..."
php -f deploy/update-assets.php > /dev/null

echo "====== Déploiement terminé avec succès ======"
echo "Les fichiers sont prêts dans le répertoire 'deploy'"
echo ""
echo "Pour finaliser le déploiement:"
echo "1. Transférez les fichiers du dossier 'deploy' vers votre serveur web"
echo "2. Accédez à update-assets.php sur votre serveur pour vérifier les références"

# Liste des fichiers déployés
echo ""
echo "Structure des fichiers déployés:"
find deploy -type f | sort | head -n 20
echo "... et plus"

exit 0
