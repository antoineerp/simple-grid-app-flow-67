
#!/bin/bash
# Script pour vérifier l'existence et les permissions du fichier users.ini

echo "==========================================="
echo "Vérification de users.ini - $(date)"
echo "==========================================="

# Chemin du fichier
USERS_FILE="./users.ini"

# Vérifier l'existence du fichier
if [ -f "$USERS_FILE" ]; then
    echo "✓ Le fichier users.ini existe"
    
    # Vérifier les permissions
    PERMS=$(stat -c "%a" "$USERS_FILE" 2>/dev/null || stat -f "%Lp" "$USERS_FILE" 2>/dev/null)
    OWNER=$(stat -c "%U" "$USERS_FILE" 2>/dev/null || stat -f "%Su" "$USERS_FILE" 2>/dev/null)
    GROUP=$(stat -c "%G" "$USERS_FILE" 2>/dev/null || stat -f "%Sg" "$USERS_FILE" 2>/dev/null)
    
    echo "• Permissions: $PERMS (propriétaire: $OWNER, groupe: $GROUP)"
    
    # Recommandations de sécurité pour les permissions
    if [ "$PERMS" -eq "644" ] || [ "$PERMS" -gt "644" ]; then
        echo "⚠️ AVERTISSEMENT: Les permissions sont trop permissives ($PERMS)"
        echo "  Recommandation: chmod 600 users.ini ou chmod 640 users.ini"
    else
        echo "✓ Les permissions semblent correctes ($PERMS)"
    fi
    
    # Vérifier si le fichier est accessible en HTTP
    if command -v curl &> /dev/null; then
        echo -n "• Test d'accès HTTP: "
        HTTP_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/users.ini 2>/dev/null || echo "impossible")
        
        if [ "$HTTP_RESULT" = "403" ]; then
            echo "✓ Protégé (403 Forbidden)"
        elif [ "$HTTP_RESULT" = "404" ]; then
            echo "✓ Non trouvable (404 Not Found)"
        elif [ "$HTTP_RESULT" = "impossible" ]; then
            echo "? Impossible de tester (curl a échoué)"
        else
            echo "⚠️ RISQUE: Le fichier renvoie $HTTP_RESULT, il pourrait être accessible!"
        fi
    else
        echo "• Test d'accès HTTP: curl non disponible, impossible de tester"
    fi
    
    # Vérifier le contenu du fichier
    echo -e "\n• Aperçu du contenu (commentaires uniquement):"
    grep "^;" "$USERS_FILE" | head -5
    
    # Compter les utilisateurs
    USER_COUNT=$(grep -v "^;" "$USERS_FILE" | grep -v "^$" | wc -l)
    echo "• Nombre d'utilisateurs définis: $USER_COUNT"
    
else
    echo "✗ Le fichier users.ini N'EXISTE PAS à l'emplacement actuel"
    
    # Recherche du fichier dans les sous-répertoires
    echo -e "\nRecherche du fichier users.ini dans les sous-répertoires..."
    FOUND_FILES=$(find . -name "users.ini" 2>/dev/null)
    
    if [ -z "$FOUND_FILES" ]; then
        echo "✗ Aucun fichier users.ini trouvé dans les sous-répertoires"
    else
        echo "! Fichiers users.ini trouvés ailleurs:"
        echo "$FOUND_FILES"
    fi
    
    echo -e "\nPour créer le fichier, utilisez la commande:"
    echo "touch users.ini && chmod 600 users.ini && nano users.ini"
fi

echo -e "\nVérification terminée"
