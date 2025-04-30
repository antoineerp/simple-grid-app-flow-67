
import { Exigence } from '@/types/exigences';

export const getExigences = async (): Promise<Exigence[]> => {
  try {
    // Check local storage first
    const storedExigences = localStorage.getItem('exigences');
    if (storedExigences) {
      return JSON.parse(storedExigences);
    }

    // If no local data, return empty array (could be expanded to fetch from API)
    return [];
  } catch (error) {
    console.error('Error fetching exigences:', error);
    throw new Error('Failed to fetch exigences');
  }
};

export const saveExigences = async (exigences: Exigence[]): Promise<boolean> => {
  try {
    localStorage.setItem('exigences', JSON.stringify(exigences));
    return true;
  } catch (error) {
    console.error('Error saving exigences:', error);
    return false;
  }
};
