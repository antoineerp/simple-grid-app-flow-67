
import { Membre } from '@/types/membres';

/**
 * Synchronise les membres entre différents utilisateurs en local
 * @param membres Les membres à synchroniser
 * @param sourceUser L'utilisateur source
 * @param targetUsers Les utilisateurs cibles
 */
export const synchroniserMembresEntreUtilisateurs = (
  membres: Membre[],
  sourceUser: string,
  targetUsers: string[]
): void => {
  console.log(`Synchronisation locale des membres depuis ${sourceUser} vers ${targetUsers.length} utilisateurs`);
  
  // Cloner les membres pour éviter les références
  const membresClone = JSON.parse(JSON.stringify(membres));
  
  // Pour chaque utilisateur cible, enregistrer les membres
  targetUsers.forEach(targetUser => {
    if (targetUser !== sourceUser) {
      console.log(`- Synchronisation des données vers ${targetUser}`);
      localStorage.setItem(`membres_${targetUser}`, JSON.stringify(membresClone));
    }
  });
  
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
export const createLocalTableForUser = (userId: string, fromUserId?: string): void => {
  console.log(`Création d'une table locale pour l'utilisateur ${userId}`);
  
  if (fromUserId) {
    // Copier les données depuis l'utilisateur source
    const sourceData = localStorage.getItem(`membres_${fromUserId}`);
    if (sourceData) {
      localStorage.setItem(`membres_${userId}`, sourceData);
      console.log(`Table créée avec les données de ${fromUserId}`);
      return;
    }
  }
  
  // Si pas de source ou source non trouvée, utiliser le template ou créer un template vide
  const defaultData = localStorage.getItem('membres_template') || JSON.stringify([
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
  ]);
  
  localStorage.setItem(`membres_${userId}`, defaultData);
  console.log(`Table créée avec les données par défaut`);
};

/**
 * Supprime les tables locales d'un utilisateur
 */
export const deleteLocalTablesForUser = (userId: string): void => {
  console.log(`Suppression des tables locales pour l'utilisateur ${userId}`);
  
  // Supprimer la table des membres
  localStorage.removeItem(`membres_${userId}`);
  
  // Supprimer d'autres tables associées à l'utilisateur si nécessaire
  // localStorage.removeItem(`documents_${userId}`);
  // localStorage.removeItem(`exigences_${userId}`);
  
  console.log(`Tables supprimées pour l'utilisateur ${userId}`);
};
