
# Standard des Endpoints de Synchronisation

## Introduction

Ce document définit le standard à suivre pour tous les endpoints de synchronisation PHP de l'application. L'objectif est de garantir la cohérence, la maintenabilité et la fiabilité des opérations de synchronisation entre le client et le serveur.

## Structure Commune des Endpoints

Chaque endpoint doit suivre cette structure générale:

1. **En-tête et initialisation**
   - Activation du buffer de sortie
   - Inclusion des dépendances nécessaires
   - Création du service de synchronisation

2. **Validation et préparation**
   - Définition des en-têtes HTTP
   - Gestion des requêtes OPTIONS (CORS)
   - Validation de la méthode HTTP
   - Extraction et validation des paramètres (userId, deviceId)

3. **Traitement principal**
   - Connexion à la base de données
   - Détermination du nom de table utilisateur
   - Vérification de l'existence de la table
   - Création de la table si nécessaire
   - Enregistrement de l'opération dans l'historique
   - Exécution des opérations spécifiques (chargement/sauvegarde)

4. **Réponse**
   - Format JSON standard
   - Inclusion des métadonnées communes (timestamp, count)
   - Gestion des erreurs cohérente

5. **Nettoyage**
   - Fermeture des connexions
   - Finalisation du buffer de sortie

## Conventions de Nommage

- **Fichiers**: `[nom-table]-load.php` ou `[nom-table]-sync.php`
- **Tables**: `[nom-table]_[userId]`
- **Champs obligatoires**: `id`, `userId`, `date_creation`, `date_modification`

## Format de Réponse Standard

### Succès
```json
{
  "success": true,
  "records": [...],  // ou nom spécifique à la ressource
  "count": 42,
  "timestamp": "2025-05-04T12:34:56+00:00",
  "deviceId": "device-123"
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "code": 400  // optionnel
}
```

## Gestion des Erreurs

- Utiliser des blocs try-catch-finally
- Logger toutes les erreurs avec `error_log()`
- Retourner des codes HTTP appropriés (400, 401, 403, 500)
- Fournir des messages d'erreur explicites

## Sécurité

- Valider et assainir tous les paramètres entrants
- Utiliser des requêtes préparées pour les interactions avec la base de données
- Vérifier les autorisations avant d'accéder aux données

## Journalisation

- Enregistrer toutes les opérations de synchronisation dans la table `sync_history`
- Logger le début et la fin de l'exécution de chaque endpoint
- Logger les erreurs avec suffisamment de contexte pour le débogage

## Template de Référence

Voir le fichier `api/templates/sync-endpoint-template.php` pour un modèle prêt à l'emploi.
