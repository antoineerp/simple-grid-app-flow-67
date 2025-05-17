
<?php
// Get the error code from the request
$code = isset($_GET['code']) ? intval($_GET['code']) : 404;

// Set appropriate HTTP status code
http_response_code($code);

// Set the content type
header('Content-Type: text/html; charset=UTF-8');

// Map error codes to messages
$messages = [
    400 => 'Bad Request',
    401 => 'Unauthorized',
    403 => 'Forbidden',
    404 => 'Page Not Found',
    500 => 'Internal Server Error',
    502 => 'Bad Gateway',
    503 => 'Service Unavailable',
    504 => 'Gateway Timeout'
];

$message = isset($messages[$code]) ? $messages[$code] : 'Unknown Error';

// Get referring page
$referer = isset($_SERVER['HTTP_REFERER']) ? htmlspecialchars($_SERVER['HTTP_REFERER']) : 'previous page';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $code; ?> - <?php echo $message; ?></title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 650px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
        }
        h1 {
            font-size: 3rem;
            color: #d32f2f;
            margin-bottom: 0.5rem;
        }
        p {
            font-size: 1.1rem;
            color: #555;
        }
        .btn {
            display: inline-block;
            background-color: #2196f3;
            color: white;
            padding: 0.75rem 1.5rem;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 1rem;
            transition: background-color 0.2s;
        }
        .btn:hover {
            background-color: #1976d2;
        }
    </style>
</head>
<body>
    <h1><?php echo $code; ?></h1>
    <h2><?php echo $message; ?></h2>
    
    <p>Désolé, une erreur s'est produite lors de l'accès à cette page.</p>
    
    <?php if ($code == 404): ?>
    <p>La page que vous avez demandée n'existe pas ou a été déplacée.</p>
    <?php elseif ($code >= 500): ?>
    <p>Notre serveur a rencontré un problème. Veuillez réessayer plus tard.</p>
    <?php endif; ?>
    
    <a href="/" class="btn">Retour à l'accueil</a>
    
    <p><small>Référence de l'erreur: <?php echo date('Ymd-His'); ?></small></p>
</body>
</html>
<?php
// Log the error
$log_message = date('Y-m-d H:i:s') . " - Error $code - " . $_SERVER['REQUEST_URI'] . " - Referer: " . ($referer ?? 'none');
error_log($log_message);
?>
