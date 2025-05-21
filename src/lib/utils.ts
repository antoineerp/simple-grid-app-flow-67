
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate une date en chaîne de caractères lisible
 * @param date La date à formater
 * @returns La date formatée en chaîne de caractères
 */
export function formatDate(date: Date | null): string {
  if (!date) return "Jamais";
  
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
}
