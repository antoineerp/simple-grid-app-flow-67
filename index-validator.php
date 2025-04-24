
<?php
// Utility: index.html validation and patching

// Validates references in index.html and returns an array of booleans
function validate_index_references($content) {
    return [
        'has_js_reference'   => preg_match('/<script[^>]*src="\/assets\/[^"]*\.js"[^>]*>/i', $content),
        'has_css_reference'  => preg_match('/<link[^>]*href="\/assets\/[^"]*\.css"[^>]*>/i', $content),
        'has_src_reference'  => preg_match('/<script[^>]*src="\/src\/[^"]*"[^>]*>/i', $content),
    ];
}

// Patches index.html with latest assets, returns new content
function patch_index_html($content, $js_file = '', $css_file = '') {
    $new_content = $content;

    // Add CSS link if not exists
    if ($css_file && !preg_match('/<link[^>]*href="\/assets\/[^"]*\.css"[^>]*>/i', $content)) {
        $new_content = preg_replace(
            '/<\/head>/',
            '    <link rel="stylesheet" href="/assets/' . $css_file . '" />' . "\n" . '</head>',
            $new_content
        );
    }

    // Replace <script src="/src/..."> with built JS
    if ($js_file && preg_match('/<script[^>]*src="\/src\/[^"]*"[^>]*>/', $content)) {
        $new_content = preg_replace(
            '/<script[^>]*src="\/src\/[^"]*"[^>]*>/',
            '<script type="module" src="/assets/' . $js_file . '">',
            $new_content
        );
    }
    // Or inject JS script if none exists
    else if ($js_file && !preg_match('/<script[^>]*src="\/assets\/[^"]*\.js"[^>]*>/i', $content)) {
        $new_content = preg_replace(
            '/<\/body>/',
            '    <script type="module" src="/assets/' . $js_file . '"></script>' . "\n" . '</body>',
            $new_content
        );
    }

    return $new_content;
}
