
import { Membre } from '@/types/membres';

/**
 * Synchronise les membres dans le stockage local uniquement pour l'utilisateur concerné
 * @param membres Les membres à synchroniser
 * @param userId L'identifiant de l'utilisateur
 */
export const synchroniserMembresLocaux = (
  membres: Membre[],
  userId: string
): void => {
  console.log(`Mise à jour locale des données membres pour l'utilisateur ${userId}`);
  
  // Cloner les membres pour éviter les références
  const membresClone = JSON.parse(JSON.stringify(membres));
  
  // Enregistrer dans le localStorage pour cet utilisateur uniquement
  localStorage.setItem(`membres_${userId}`, JSON.stringify(membresClone));
  
  // Notifier sur la mise à jour des membres
  window.dispatchEvent(new Event('membresLocalSync'));
};

/**
 * Récupère la liste des utilisateurs disponibles en local
 */
export const getLocalUsers = (): string[] => {
  const users: string[] = [];
  
  // Parcourir le localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    // Si la clé correspond à un utilisateur (format: membres_[user])
    if (key && key.startsWith('membres_') && key !== 'membres_template') {
      const user = key.replace('membres_', '');
      users.push(user);
    }
  }
  
  return users;
};

/**
 * Crée une table locale pour un nouvel utilisateur
 */
export const createLocalTableForUser = (userId: string): void => {
  console.log(`Création d'une table locale pour l'utilisateur ${userId}`);
  
  // Vérifier si la table existe déjà
  if (localStorage.getItem(`membres_${userId}`)) {
    console.log(`La table locale pour ${userId} existe déjà`);
    return;
  }
  
  // Chercher un gestionnaire
  let sourceData = null;
  const users = getLocalUsers();
  
  // Recherche d'un utilisateur gestionnaire stocké en local
  for (const user of users) {
    const userRole = localStorage.getItem(`role_${user}`);
    if (userRole === 'gestionnaire') {
      sourceData = localStorage.getItem(`membres_${user}`);
      if (sourceData) {
        console.log(`Utilisation des données du gestionnaire local ${user}`);
        break;
      }
    }
  }
  
  // Si aucun gestionnaire trouvé, chercher un administrateur
  if (!sourceData) {
    for (const user of users) {
      const userRole = localStorage.getItem(`role_${user}`);
      if (userRole === 'admin' || userRole === 'administrateur') {
        sourceData = localStorage.getItem(`membres_${user}`);
        if (sourceData) {
          console.log(`Utilisation des données de l'administrateur local ${user}`);
          break;
        }
      }
    }
  }
  
  // Si on a trouvé des données sources, les utiliser
  if (sourceData) {
    localStorage.setItem(`membres_${userId}`, sourceData);
    console.log(`Table locale créée pour ${userId} avec données existantes`);
    return;
  }
  
  // Sinon, créer des données par défaut
  const defaultData = [
    { 
      id: '1', 
      nom: 'Dupont',
      prenom: 'Jean',
      fonction: 'Directeur',
      initiales: 'JD',
      date_creation: new Date(),
      mot_de_passe: '' 
    },
    { 
      id: '2', 
      nom: 'Martin',
      prenom: 'Sophie',
      fonction: 'Qualité',
      initiales: 'SM',
      date_creation: new Date(),
      mot_de_passe: ''
    },
  ];
  
  localStorage.setItem(`membres_${userId}`, JSON.stringify(defaultData));
  console.log(`Table locale créée pour ${userId} avec données par défaut`);
};

/**
 * Supprime les tables locales d'un utilisateur
 */
export const deleteLocalTablesForUser = (userId: string): void => {
  console.log(`Suppression des tables locales pour l'utilisateur ${userId}`);
  
  // Supprimer la table des membres
  localStorage.removeItem(`membres_${userId}`);
  
  // Supprimer d'autres tables associées à l'utilisateur
  localStorage.removeItem(`documents_${userId}`);
  localStorage.removeItem(`exigences_${userId}`);
  
  console.log(`Tables supprimées pour l'utilisateur ${userId}`);
};
