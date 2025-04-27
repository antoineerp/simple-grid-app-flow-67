
<?php
header('Content-Type: text/html; charset=utf-8');

function findLatestAsset($pattern) {
    $files = glob($pattern);
    if (empty($files)) return null;
    
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    
    return $files[0];
}

$jsFile = findLatestAsset('./assets/main-*.js') ?: findLatestAsset('./assets/*.js');
$cssFile = findLatestAsset('./assets/index-*.css') ?: findLatestAsset('./assets/*.css');

$indexPath = './index.html';
$content = file_get_contents($indexPath);

if ($jsFile) {
    $jsPath = str_replace('./', '/', $jsFile);
    $content = preg_replace(
        '/<script[^>]*src=["\'](\.\/|\/)?src\/[^"\']*\.tsx?["\'][^>]*>/',
        '<script type="module" src="' . $jsPath . '"></script>',
        $content
    );
}

if ($cssFile) {
    $cssPath = str_replace('./', '/', $cssFile);
    $content = preg_replace(
        '/<link[^>]*href=["\'](\.\/|\/)?src\/[^"\']*\.css["\'][^>]*>/',
        '<link rel="stylesheet" href="' . $cssPath . '">',
        $content
    );
}

file_put_contents($indexPath, $content);

echo "Assets mis à jour avec succès !";
?>
