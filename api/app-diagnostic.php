
<?php
header('Content-Type: application/json');

$diagnostics = [
    'routes' => [
        '/' => file_exists(__DIR__ . '/../index.html'),
        '/pilotage' => file_exists(__DIR__ . '/../src/pages/Pilotage.tsx'),
        '/exigences' => file_exists(__DIR__ . '/../src/pages/Exigences.tsx'),
        '/gestion-documentaire' => file_exists(__DIR__ . '/../src/pages/GestionDocumentaire.tsx'),
    ],
    'core_files' => [
        'main.jsx' => file_exists(__DIR__ . '/../src/main.jsx'),
        'App.tsx' => file_exists(__DIR__ . '/../src/App.tsx'),
        'index.html' => file_exists(__DIR__ . '/../index.html'),
    ],
    'system_check' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    ]
];

echo json_encode([
    'status' => 'success',
    'diagnostics' => $diagnostics
], JSON_PRETTY_PRINT);
