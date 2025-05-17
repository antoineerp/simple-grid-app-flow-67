
# API FormaCert Standardisée

Cette API suit un format de réponse uniforme pour faciliter l'intégration et la maintenance.

## Format de réponse standard

Toutes les API de l'application renvoient des réponses au format JSON avec la structure suivante:

```json
{
  "success": true,
  "message": "Description de l'opération",
  "code": 200,
  "timestamp": "2025-05-17T19:30:00Z",
  "data": {
    // Données spécifiques à l'endpoint
  }
}
```

## Endpoints de synchronisation

Les endpoints de synchronisation suivent une convention de nommage uniforme:

- Chargement: `[entité]-load.php` - Méthode GET
- Sauvegarde: `[entité]-sync.php` - Méthode POST

### Exemple pour les membres:

- GET `/api/membres-load.php?userId=xxx&deviceId=yyy`
- POST `/api/membres-sync.php` avec données JSON

## Paramètres communs

Tous les endpoints de synchronisation utilisent ces paramètres:

- `userId`: Identifiant de l'utilisateur
- `deviceId`: Identifiant unique de l'appareil

## Authentification

Les endpoints d'authentification suivent la même convention de format de réponse.

## Gestion des erreurs

Les erreurs sont signalées par:

- Code HTTP approprié
- `success: false` dans la réponse
- Message d'erreur descriptif

Exemple:
```json
{
  "success": false,
  "message": "Paramètres manquants",
  "code": 400,
  "timestamp": "2025-05-17T19:30:00Z",
  "data": {
    "missing": ["userId", "deviceId"]
  }
}
```
