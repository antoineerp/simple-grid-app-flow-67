import { Membre } from '@/types/membres';
import { triggerSync } from '@/services/sync';
import { getCurrentUserId } from '@/services/core/userService';

// Get current user identifier for test data
const getUserIdentifier = () => {
  // Using user ID instead of email for test data identification
  const currentUserId = getCurrentUserId();
  return currentUserId === 'p71x6d_cirier' ? 'antcirier' : 'default';
};

// Test data map based on user email
const testDataByUser = {
  antcirier: [
    { 
      id: "ac-user1", 
      nom: "Dupont", 
      prenom: "Jean", 
      email: "jean.dupont@formacert.fr", 
      role: "Formateur", 
      departement: "Formation",
      fonction: "Formateur principal",
      userId: "p71x6d_cirier"
    },
    { 
      id: "ac-user2", 
      nom: "Martin", 
      prenom: "Sophie", 
      email: "sophie.martin@formacert.fr", 
      role: "Responsable", 
      departement: "Qualité",
      fonction: "Responsable qualité",
      userId: "p71x6d_cirier"
    },
    { 
      id: "ac-user3", 
      nom: "Blanc", 
      prenom: "Thomas", 
      email: "thomas.blanc@formacert.fr", 
      role: "Assistant", 
      departement: "Administration",
      fonction: "Assistant administratif",
      userId: "p71x6d_cirier"
    },
  ],
  default: [
    { 
      id: "default-user1", 
      nom: "Nom-Test", 
      prenom: "Prénom-Test", 
      email: "test@example.com", 
      role: "Utilisateur", 
      departement: "Test",
      fonction: "Test"
    },
  ]
};

export const getMembres = async (): Promise<Membre[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  const userIdentifier = getUserIdentifier();
  return testDataByUser[userIdentifier] || testDataByUser.default;
};

export const refreshMembres = async (): Promise<Membre[]> => {
  // Simulate refreshing data from server
  await new Promise(resolve => setTimeout(resolve, 700));
  const userIdentifier = getUserIdentifier();
  return testDataByUser[userIdentifier] || testDataByUser.default;
};

export const getMembre = async (id: string): Promise<Membre | undefined> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  const userIdentifier = getUserIdentifier();
  const membres = testDataByUser[userIdentifier] || testDataByUser.default;
  return membres.find(membre => membre.id === id);
};

export const createMembre = async (membre: Omit<Membre, 'id'>): Promise<Membre> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate a random ID with prefix based on user
  const userIdentifier = getUserIdentifier();
  const newId = userIdentifier === 'antcirier' ? 'ac-' : 'default-';
  
  // Generate the new member with ID and add user ID if it's antcirier
  const newMembre = { 
    ...membre, 
    id: newId + Math.random().toString(36).substring(2, 11)
  };
  
  if (userIdentifier === 'antcirier') {
    newMembre.userId = "p71x6d_cirier";
  }
  
  // Trigger sync with the server
  await triggerSync("membres");
  
  return newMembre as Membre;
};

export const updateMembre = async (id: string, membre: Partial<Membre>): Promise<Membre> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const userIdentifier = getUserIdentifier();
  const membres = testDataByUser[userIdentifier] || testDataByUser.default;
  const membreToUpdate = membres.find(m => m.id === id);
  
  if (!membreToUpdate) {
    throw new Error(`Membre avec l'ID ${id} non trouvé`);
  }
  
  // Create updated membre
  const updatedMembre = { ...membreToUpdate, ...membre, id };
  
  // Trigger sync with the server
  await triggerSync("membres");
  
  return updatedMembre;
};

export const deleteMembre = async (id: string): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const userIdentifier = getUserIdentifier();
  const membres = testDataByUser[userIdentifier] || testDataByUser.default;
  const membreExists = membres.some(m => m.id === id);
  
  if (!membreExists) {
    return false;
  }
  
  // Trigger sync with the server
  await triggerSync("membres");
  
  return true;
};

export const syncMembres = async (): Promise<boolean> => {
  try {
    await triggerSync("membres");
    return true;
  } catch (error) {
    console.error("Error syncing membres:", error);
    return false;
  }
};
