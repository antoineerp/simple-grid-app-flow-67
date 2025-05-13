
<?php
header('Content-Type: application/json');

$diagnosticHtml = file_exists('../diagnostic.html');
$apiDiagnosticHtml = file_exists('diagnostic.html');

echo json_encode([
    'status' => 'success',
    'files' => [
        'diagnostic.html' => $diagnosticHtml ? 'Existe' : 'N\'existe pas',
        'api/diagnostic.html' => $apiDiagnosticHtml ? 'Existe' : 'N\'existe pas'
    ],
    'server_info' => [
        'document_root' => $_SERVER['DOCUMENT_ROOT'],
        'script_filename' => $_SERVER['SCRIPT_FILENAME'],
        'request_uri' => $_SERVER['REQUEST_URI']
    ]
]);
?>
