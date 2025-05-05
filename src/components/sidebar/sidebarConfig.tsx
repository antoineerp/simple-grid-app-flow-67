
import { Users, FileText, FolderOpen, Settings, BarChart2 } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface NavigationItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

export const navigationItems: NavigationItem[] = [
  {
    path: "/pilotage",
    icon: BarChart2,
    label: "Pilotage"
  },
  {
    path: "/gestion-documentaire",
    icon: FileText,
    label: "Gestion Documentaire"
  },
  {
    path: "/ressources-humaines",
    icon: Users,
    label: "Ressources Humaines"
  },
  {
    path: "/collaboration",
    icon: FolderOpen,
    label: "Collaboration"
  }
];
