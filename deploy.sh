
#!/bin/bash
# Script de déploiement manuel pour les environnements sans GitHub Actions

echo "====== Démarrage du déploiement manuel ======"

# Vérifier si les fichiers compilés existent déjà
if [ ! -d "dist" ] || [ ! -d "dist/assets" ]; then
    echo "ATTENTION: Le dossier dist/assets n'existe pas."
    echo "Normalement, vous devriez exécuter 'npm run build' en local avant de déployer."
    echo "Le script va continuer mais pourrait échouer si les fichiers compilés n'existent pas."
    echo ""
    echo "Si vous êtes sur un serveur d'hébergement, assurez-vous de compiler l'application"
    echo "en local et de télécharger le dossier dist avant d'exécuter ce script."
else
    echo "Fichiers compilés trouvés dans le dossier dist."
fi

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

# Copier les fichiers compilés si disponibles
echo "Copie des fichiers compilés..."
if [ -d "dist" ]; then
    cp -r dist/ deploy/dist/
    
    # IMPORTANT: Copie explicite des assets dans le dossier deploy/assets
    echo "Copie des assets vers le dossier de déploiement..."
    if [ -d "dist/assets" ]; then
        cp -r dist/assets/* deploy/assets/
        
        # Vérifier le nombre de fichiers copiés
        ASSET_COUNT=$(find deploy/assets -type f | wc -l)
        echo "Nombre de fichiers assets copiés: $ASSET_COUNT"
    else
        echo "ATTENTION: Le dossier dist/assets n'existe pas."
    fi
    
    if [ -f "dist/index.html" ]; then
        cp dist/index.html deploy/
    else
        echo "ATTENTION: Le fichier dist/index.html n'existe pas."
    fi
else
    echo "ATTENTION: Le dossier dist n'existe pas. Aucun fichier compilé à copier."
fi

# Copier .htaccess si disponible
if [ -f ".htaccess" ]; then
    cp .htaccess deploy/
else
    echo "Fichier .htaccess non trouvé"
fi

# Copier les scripts d'aide
echo "Copie des scripts d'aide..."
for script in update-assets.php fix-assets.php fix-index-references.php fix-missing-references.php fix-index-html.php check-css-build.php; do
    if [ -f "$script" ]; then
        cp "$script" deploy/
        echo "Script $script copié"
    else
        echo "$script non trouvé"
    fi
done

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

# Copier php.ini si disponible
if [ -f "api/php.ini" ]; then
    echo "Copie de php.ini..."
    cp api/php.ini deploy/
fi

# Exécuter la mise à jour des références d'assets si PHP est disponible
if command -v php >/dev/null 2>&1; then
    echo "Mise à jour des références d'assets dans index.html..."
    if [ -f "deploy/fix-index-html.php" ]; then
        php -f deploy/fix-index-html.php > /dev/null
        echo "Références d'assets mises à jour avec fix-index-html.php"
    elif [ -f "deploy/update-assets.php" ]; then
        php -f deploy/update-assets.php > /dev/null
        echo "Références d'assets mises à jour avec update-assets.php"
    else
        echo "Aucun script de mise à jour d'assets trouvé"
    fi
else
    echo "PHP n'est pas disponible. La mise à jour automatique des références n'a pas été effectuée."
    echo "Vous devrez accéder manuellement à fix-index-html.php ou update-assets.php depuis votre navigateur."
fi

echo "====== Déploiement terminé avec succès ======"
echo "Les fichiers sont prêts dans le répertoire 'deploy'"
echo ""
echo "Pour finaliser le déploiement:"
echo "1. Transférez les fichiers du dossier 'deploy' vers votre serveur web"
echo "2. Accédez à fix-index-html.php sur votre serveur pour vérifier les références"

# Liste des fichiers déployés
echo ""
echo "Structure des fichiers déployés:"
find deploy -type f | sort | head -n 20
echo "... et plus"

exit 0
