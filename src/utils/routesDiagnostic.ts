
import { navigationItems } from '@/components/sidebar/sidebarConfig';

export function checkRoutesConsistency() {
  const routeChecks = {
    totalRoutes: navigationItems.length,
    routes: navigationItems.map(item => ({
      path: item.path,
      label: item.label,
      hasComponent: checkRouteComponentExists(item.path)
    }))
  };

  console.log("🔍 Route Diagnostic:", routeChecks);
  return routeChecks;
}

function checkRouteComponentExists(path: string): boolean {
  const componentMap: { [key: string]: boolean } = {
    '/pilotage': !!document.querySelector('[data-page="pilotage"]'),
    '/exigences': !!document.querySelector('[data-page="exigences"]'),
    '/gestion-documentaire': !!document.querySelector('[data-page="gestion-documentaire"]'),
    '/ressources-humaines': !!document.querySelector('[data-page="ressources-humaines"]'),
    '/bibliotheque': !!document.querySelector('[data-page="bibliotheque"]'),
    '/administration': !!document.querySelector('[data-page="administration"]')
  };

  return componentMap[path] || false;
}

// Exécuter le diagnostic au chargement
checkRoutesConsistency();
