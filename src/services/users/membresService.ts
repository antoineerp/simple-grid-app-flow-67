
import { Membre } from '@/types/membres';
import { triggerSync } from '@/services/sync';

// Mock data for membres service
const mockMembres: Membre[] = [
  { 
    id: "user1", 
    nom: "Dupont", 
    prenom: "Jean", 
    email: "jean.dupont@example.com", 
    role: "Directeur", 
    departement: "Direction",
    fonction: "Directeur général"
  },
  { 
    id: "user2", 
    nom: "Martin", 
    prenom: "Sophie", 
    email: "sophie.martin@example.com", 
    role: "Responsable RH", 
    departement: "RH",
    fonction: "Responsable des ressources humaines"
  },
  { 
    id: "user3", 
    nom: "Bernard", 
    prenom: "Pierre", 
    email: "pierre.bernard@example.com", 
    role: "Formateur", 
    departement: "Formation",
    fonction: "Formateur principal"
  },
];

export const getMembres = async (): Promise<Membre[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockMembres;
};

export const getMembre = async (id: string): Promise<Membre | undefined> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockMembres.find(membre => membre.id === id);
};

export const createMembre = async (membre: Omit<Membre, 'id'>): Promise<Membre> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate a random ID
  const newMembre = { 
    ...membre, 
    id: Math.random().toString(36).substring(2, 11)
  };
  
  // Trigger sync with the server
  await triggerSync("membres");
  
  return newMembre;
};

export const updateMembre = async (id: string, membre: Partial<Membre>): Promise<Membre> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would update the database
  const updatedMembre = { ...mockMembres.find(m => m.id === id), ...membre, id };
  
  // Trigger sync with the server
  await triggerSync("membres");
  
  return updatedMembre as Membre;
};

export const deleteMembre = async (id: string): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would delete from the database
  
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
