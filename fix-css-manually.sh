
#!/bin/bash
# Script pour corriger manuellement les fichiers CSS manquants

echo "=== Correction manuelle des fichiers CSS ==="
date

# Vérifier si main.css existe dans assets
if [ ! -f "assets/main.css" ]; then
    echo "main.css manquant dans assets/"
    
    # Vérifier s'il existe dans dist/assets
    if [ -f "dist/assets/main.css" ]; then
        echo "Copie de main.css depuis dist/assets/"
        cp dist/assets/main.css assets/
    elif [ -f "dist/assets/index.css" ]; then
        echo "Copie de index.css vers main.css"
        cp dist/assets/index.css assets/main.css
    else
        # Créer un CSS de secours
        echo "Création d'un fichier CSS de secours"
        echo "/* Fichier CSS de secours créé $(date) */" > assets/main.css
        echo "body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }" >> assets/main.css
        echo "#root { max-width: 1280px; margin: 0 auto; padding: 2rem; }" >> assets/main.css
    fi
fi

# Vérifier que main.css existe maintenant
if [ -f "assets/main.css" ]; then
    echo "✅ assets/main.css est maintenant présent"
    ls -l assets/main.css
else
    echo "❌ ERREUR: Impossible de créer assets/main.css"
fi

# Permissions
chmod 644 assets/*.css 2>/dev/null
echo "Permissions appliquées"

echo "=== Vérification des références dans index.html ==="
if [ -f "index.html" ]; then
    if ! grep -q "assets/main.css" index.html; then
        echo "Référence à main.css non trouvée dans index.html, ajout..."
        sed -i 's/<\/head>/<link rel="stylesheet" href="\/assets\/main.css">\n<\/head>/g' index.html
        echo "✅ Référence ajoutée dans index.html"
    else
        echo "✅ Référence à main.css déjà présente dans index.html"
    fi
else
    echo "❌ index.html non trouvé"
fi

echo "=== Opération terminée ==="
