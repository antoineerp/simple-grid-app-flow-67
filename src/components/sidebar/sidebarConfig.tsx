
import { BarChart2, FileCheck, FileText, Users, Handshake, Settings } from 'lucide-react';
import { hasPermission, UserRole } from '@/types/roles';

export interface NavItem {
  path: string;
  icon: typeof BarChart2;
  label: string;
  requiredPermission?: keyof typeof hasPermission;
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
    path: '/collaboration',
    icon: Handshake,
    label: 'Collaboration'
  },
  {
    path: '/administration',
    icon: Settings,
    label: 'Administration'
  }
];

// Ajout de l'élément Administration à la liste principale
