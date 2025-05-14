
#!/bin/bash
# Script pour créer les dossiers nécessaires

mkdir -p api/config
mkdir -p api/controllers
mkdir -p api/models
mkdir -p assets
mkdir -p public/lovable-uploads

# Définir les permissions appropriées
chmod 755 api
chmod 755 api/config
chmod 755 api/controllers
chmod 755 api/models
chmod 755 assets
chmod 755 public
chmod 755 public/lovable-uploads

echo "Dossiers créés avec succès"
