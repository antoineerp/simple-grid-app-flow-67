
import { BarChart2, FileCheck, FileText, Users, BookOpen } from 'lucide-react';

export interface NavItem {
  path: string;
  icon: typeof BarChart2;
  label: string;
}

export const navigationItems: NavItem[] = [
  {
    path: '/pilotage',
    icon: BarChart2,
    label: 'Pilotage'
  },
  {
    path: '/exigences',
    icon: FileCheck,
    label: 'Exigences'
  },
  {
    path: '/gestion-documentaire',
    icon: FileText,
    label: 'Gestion Documentaire'
  },
  {
    path: '/ressources-humaines',
    icon: Users,
    label: 'Ressources Humaines'
  },
  {
    path: '/bibliotheque',
    icon: BookOpen,
    label: 'Bibliothèque'
  }
];
