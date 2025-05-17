
<?php
header('Content-Type: text/html; charset=UTF-8');

/**
 * Scanner de Routes d'Application
 * 
 * Cet outil analyse les fichiers source d'une application React
 * pour identifier et vérifier les routes, les liens et les pages.
 * 
 * @version 1.0.0
 */

class RouteScanner {
    private $sourceDir;
    private $routes = [];
    private $links = [];
    private $pages = [];
    private $navigationFiles = [];
    private $duplicates = [];
    private $unmatchedLinks = [];
    
    public function __construct($sourceDir = './src') {
        $this->sourceDir = realpath($sourceDir);
        $this->scanAllFiles();
    }
    
    private function scanAllFiles() {
        $this->routes = $this->findRoutes();
        $this->links = $this->findLinks();
        $this->pages = $this->findPages();
        $this->navigationFiles = $this->findNavigationFiles();
        $this->findDuplicates();
        $this->findUnmatchedLinks();
    }
    
    private function findRoutes() {
        $routes = [];
        $files = $this->getFilesWithExtensions(['tsx', 'ts', 'jsx', 'js']);
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            
            // Rechercher les déclarations de routes React Router v6
            if (preg_match_all('/<Route\s+[^>]*path=[\'"]([^\'"]+)[\'"][^>]*>/', $content, $matches)) {
                foreach ($matches[1] as $path) {
                    $relativePath = $this->getRelativePath($file);
                    if (!isset($routes[$path])) {
                        $routes[$path] = [];
                    }
                    $routes[$path][] = $relativePath;
                }
            }
            
            // Rechercher aussi les déclarations avec element={}
            if (preg_match_all('/<Route\s+[^>]*path=[\'"]([^\'"]+)[\'"][^>]*element=\{[^}]+\}[^>]*\/>/', $content, $matches)) {
                foreach ($matches[1] as $path) {
                    $relativePath = $this->getRelativePath($file);
                    if (!isset($routes[$path])) {
                        $routes[$path] = [];
                    }
                    $routes[$path][] = $relativePath;
                }
            }
        }
        
        return $routes;
    }
    
    private function findLinks() {
        $links = [];
        $files = $this->getFilesWithExtensions(['tsx', 'ts', 'jsx', 'js']);
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            
            // Rechercher les composants Link
            if (preg_match_all('/<Link\s+[^>]*to=[\'"]([^\'"]+)[\'"][^>]*>/', $content, $matches)) {
                foreach ($matches[1] as $path) {
                    $relativePath = $this->getRelativePath($file);
                    if (!isset($links[$path])) {
                        $links[$path] = [];
                    }
                    $links[$path][] = $relativePath;
                }
            }
            
            // Rechercher les appels à navigate
            if (preg_match_all('/navigate\([\'"]([^\'"]+)[\'"]/', $content, $matches)) {
                foreach ($matches[1] as $path) {
                    $relativePath = $this->getRelativePath($file);
                    if (!isset($links[$path])) {
                        $links[$path] = [];
                    }
                    $links[$path][] = $relativePath;
                }
            }
        }
        
        return $links;
    }
    
    private function findPages() {
        $pages = [];
        $pagesDir = $this->sourceDir . '/pages';
        
        if (is_dir($pagesDir)) {
            $files = glob($pagesDir . '/*.{tsx,ts,jsx,js}', GLOB_BRACE);
            foreach ($files as $file) {
                $pageName = pathinfo($file, PATHINFO_FILENAME);
                $pages[$pageName] = $this->getRelativePath($file);
            }
        }
        
        return $pages;
    }
    
    private function findNavigationFiles() {
        $navigationFiles = [];
        $files = $this->getFilesWithExtensions(['tsx', 'ts', 'jsx', 'js']);
        
        foreach ($files as $file) {
            $content = file_get_contents($file);
            
            // Si le fichier contient des éléments de navigation, on le considère comme un fichier de navigation
            if (strpos($content, '<Link') !== false || 
                strpos($content, 'useNavigate') !== false ||
                strpos($content, 'NavLink') !== false ||
                strpos($content, '<Route') !== false) {
                
                $relativePath = $this->getRelativePath($file);
                $navigationFiles[] = $relativePath;
            }
        }
        
        return $navigationFiles;
    }
    
    private function findDuplicates() {
        $this->duplicates = [];
        
        foreach ($this->routes as $path => $files) {
            if (count($files) > 1) {
                $this->duplicates[$path] = $files;
            }
        }
    }
    
    private function findUnmatchedLinks() {
        $this->unmatchedLinks = [];
        
        foreach ($this->links as $path => $files) {
            if ($path[0] === '/' && !isset($this->routes[$path])) {
                $this->unmatchedLinks[$path] = $files;
            }
        }
    }
    
    private function getFilesWithExtensions($extensions) {
        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($this->sourceDir)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $extension = pathinfo($file->getPathname(), PATHINFO_EXTENSION);
                if (in_array($extension, $extensions)) {
                    $files[] = $file->getPathname();
                }
            }
        }
        
        return $files;
    }
    
    private function getRelativePath($file) {
        return str_replace($this->sourceDir . '/', '', $file);
    }
    
    public function getRoutes() {
        return $this->routes;
    }
    
    public function getLinks() {
        return $this->links;
    }
    
    public function getPages() {
        return $this->pages;
    }
    
    public function getNavigationFiles() {
        return $this->navigationFiles;
    }
    
    public function getDuplicates() {
        return $this->duplicates;
    }
    
    public function getUnmatchedLinks() {
        return $this->unmatchedLinks;
    }
    
    public function generateReport() {
        $report = [
            'routesCount' => count($this->routes),
            'linksCount' => count($this->links),
            'pagesCount' => count($this->pages),
            'navigationFilesCount' => count($this->navigationFiles),
            'duplicatesCount' => count($this->duplicates),
            'unmatchedLinksCount' => count($this->unmatchedLinks),
            'routes' => $this->routes,
            'links' => $this->links,
            'pages' => $this->pages,
            'navigationFiles' => $this->navigationFiles,
            'duplicates' => $this->duplicates,
            'unmatchedLinks' => $this->unmatchedLinks
        ];
        
        return $report;
    }
}

// Créer le scanner et générer un rapport
$scanner = new RouteScanner();
$report = $scanner->generateReport();

// Fonction pour afficher le rapport HTML
function displayHtmlReport($report) {
    ?>
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport d'analyse des routes</title>
        <style>
            :root {
                --color-bg: #f9f9f9;
                --color-text: #333;
                --color-primary: #3498db;
                --color-secondary: #2ecc71;
                --color-warning: #f39c12;
                --color-danger: #e74c3c;
                --color-light: #ecf0f1;
                --color-dark: #34495e;
                --color-code-bg: #f5f7fa;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                line-height: 1.6;
                color: var(--color-text);
                background-color: var(--color-bg);
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }
            
            h1, h2, h3, h4 {
                color: var(--color-dark);
                margin-bottom: 15px;
            }
            
            h1 {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--color-light);
            }
            
            .summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .summary-card {
                background: var(--color-light);
                padding: 15px;
                border-radius: 5px;
                text-align: center;
            }
            
            .summary-card.warning {
                background-color: #fff3cd;
            }
            
            .summary-card h3 {
                font-size: 16px;
                margin-bottom: 10px;
            }
            
            .summary-card p {
                font-size: 24px;
                font-weight: bold;
                color: var(--color-primary);
            }
            
            .summary-card.warning p {
                color: var(--color-warning);
            }
            
            section {
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--color-light);
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }
            
            th, td {
                padding: 10px;
                text-align: left;
                border-bottom: 1px solid var(--color-light);
            }
            
            th {
                background-color: var(--color-light);
                font-weight: 600;
            }
            
            code {
                font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
                background-color: var(--color-code-bg);
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 14px;
            }
            
            .badge {
                display: inline-block;
                padding: 3px 7px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .badge-primary {
                background-color: var(--color-primary);
                color: white;
            }
            
            .badge-warning {
                background-color: var(--color-warning);
                color: white;
            }
            
            .badge-danger {
                background-color: var(--color-danger);
                color: white;
            }
            
            .badge-success {
                background-color: var(--color-secondary);
                color: white;
            }
            
            .file-list {
                margin-top: 5px;
                font-size: 14px;
                color: #666;
            }

            .file-list a {
                display: inline-block;
                margin-right: 5px;
                margin-bottom: 3px;
            }
            
            .toggle-details {
                background: none;
                border: none;
                color: var(--color-primary);
                cursor: pointer;
                padding: 5px;
                font-size: 14px;
            }
            
            .details {
                display: none;
                padding: 10px;
                background: var(--color-code-bg);
                margin-top: 5px;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Rapport d'analyse des routes de l'application</h1>
            
            <div class="summary">
                <div class="summary-card">
                    <h3>Routes définies</h3>
                    <p><?php echo $report['routesCount']; ?></p>
                </div>
                <div class="summary-card">
                    <h3>Liens utilisés</h3>
                    <p><?php echo $report['linksCount']; ?></p>
                </div>
                <div class="summary-card">
                    <h3>Pages</h3>
                    <p><?php echo $report['pagesCount']; ?></p>
                </div>
                <div class="summary-card">
                    <h3>Fichiers de navigation</h3>
                    <p><?php echo $report['navigationFilesCount']; ?></p>
                </div>
                <div class="summary-card <?php echo $report['duplicatesCount'] > 0 ? 'warning' : ''; ?>">
                    <h3>Routes en double</h3>
                    <p><?php echo $report['duplicatesCount']; ?></p>
                </div>
                <div class="summary-card <?php echo $report['unmatchedLinksCount'] > 0 ? 'warning' : ''; ?>">
                    <h3>Liens sans route</h3>
                    <p><?php echo $report['unmatchedLinksCount']; ?></p>
                </div>
            </div>
            
            <?php if ($report['duplicatesCount'] > 0): ?>
            <section>
                <h2>⚠️ Routes en double</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Chemin</th>
                            <th>Fichiers</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($report['duplicates'] as $path => $files): ?>
                        <tr>
                            <td><code><?php echo htmlspecialchars($path); ?></code></td>
                            <td>
                                <span class="badge badge-danger"><?php echo count($files); ?> définitions</span>
                                <div class="file-list">
                                    <?php foreach ($files as $file): ?>
                                    <a href="#" title="<?php echo htmlspecialchars($file); ?>"><?php echo basename($file); ?></a>
                                    <?php endforeach; ?>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </section>
            <?php endif; ?>
            
            <?php if ($report['unmatchedLinksCount'] > 0): ?>
            <section>
                <h2>⚠️ Liens sans route correspondante</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Lien</th>
                            <th>Utilisé dans</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($report['unmatchedLinks'] as $path => $files): ?>
                        <tr>
                            <td><code><?php echo htmlspecialchars($path); ?></code></td>
                            <td>
                                <span class="badge badge-warning"><?php echo count($files); ?> utilisations</span>
                                <div class="file-list">
                                    <?php foreach ($files as $file): ?>
                                    <a href="#" title="<?php echo htmlspecialchars($file); ?>"><?php echo basename($file); ?></a>
                                    <?php endforeach; ?>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </section>
            <?php endif; ?>
            
            <section>
                <h2>Routes définies</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Chemin</th>
                            <th>Définition</th>
                            <th>Utilisé</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($report['routes'] as $path => $files): ?>
                        <tr>
                            <td><code><?php echo htmlspecialchars($path); ?></code></td>
                            <td>
                                <span class="badge <?php echo count($files) > 1 ? 'badge-danger' : 'badge-success'; ?>">
                                    <?php echo count($files); ?> définition<?php echo count($files) > 1 ? 's' : ''; ?>
                                </span>
                                <div class="file-list">
                                    <?php foreach ($files as $file): ?>
                                    <a href="#" title="<?php echo htmlspecialchars($file); ?>"><?php echo basename($file); ?></a>
                                    <?php endforeach; ?>
                                </div>
                            </td>
                            <td>
                                <?php 
                                $usedCount = isset($report['links'][$path]) ? count($report['links'][$path]) : 0;
                                $badgeClass = $usedCount > 0 ? 'badge-success' : 'badge-warning';
                                ?>
                                <span class="badge <?php echo $badgeClass; ?>">
                                    <?php echo $usedCount; ?> lien<?php echo $usedCount !== 1 ? 's' : ''; ?>
                                </span>
                                <?php if ($usedCount > 0): ?>
                                <button class="toggle-details" onclick="toggleDetails('links-<?php echo md5($path); ?>')">Détails</button>
                                <div id="links-<?php echo md5($path); ?>" class="details">
                                    <?php foreach ($report['links'][$path] as $file): ?>
                                    <div><?php echo htmlspecialchars($file); ?></div>
                                    <?php endforeach; ?>
                                </div>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </section>
            
            <section>
                <h2>Pages identifiées</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Fichier</th>
                            <th>Route correspondante</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($report['pages'] as $name => $file): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($name); ?></td>
                            <td><code><?php echo htmlspecialchars($file); ?></code></td>
                            <td>
                                <?php 
                                $matchingRoutes = [];
                                foreach ($report['routes'] as $path => $routeFiles) {
                                    $basePath = strtolower('/' . $name);
                                    if ($path === $basePath || $path === $basePath . '/' || strpos($path, $basePath . '/') === 0) {
                                        $matchingRoutes[] = $path;
                                    }
                                }
                                
                                if (!empty($matchingRoutes)) {
                                    echo '<span class="badge badge-success">' . count($matchingRoutes) . ' routes</span>';
                                    echo '<div class="file-list">';
                                    foreach ($matchingRoutes as $route) {
                                        echo '<code>' . htmlspecialchars($route) . '</code> ';
                                    }
                                    echo '</div>';
                                } else {
                                    echo '<span class="badge badge-warning">Aucune route</span>';
                                }
                                ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </section>
            
            <script>
                function toggleDetails(id) {
                    const element = document.getElementById(id);
                    if (element.style.display === 'block') {
                        element.style.display = 'none';
                    } else {
                        element.style.display = 'block';
                    }
                }
            </script>
        </div>
    </body>
    </html>
    <?php
}

// Afficher le rapport
displayHtmlReport($report);
?>
